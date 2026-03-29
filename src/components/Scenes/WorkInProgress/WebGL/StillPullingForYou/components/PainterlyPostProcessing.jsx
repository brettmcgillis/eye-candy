import * as THREE from 'three';

import { useMemo, useRef } from 'react';

import { useFBO, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';

// ── Shared vertex shader ────────────────────────────────────────────────────
const FULLSCREEN_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// ── Pass 1: Structure Tensor via Sobel operator ─────────────────────────────
const TENSOR_FRAGMENT = /* glsl */ `
varying vec2 vUv;
uniform sampler2D inputBuffer;
uniform vec4 resolution;

const mat3 Gx = mat3(-1, -2, -1, 0, 0, 0, 1, 2, 1);
const mat3 Gy = mat3(-1, 0, 1, -2, 0, 2, -1, 0, 1);

vec4 computeStructureTensor(sampler2D tex, vec2 uv) {
  vec3 tx0y0 = texture2D(tex, uv + vec2(-1, -1) / resolution.xy).rgb;
  vec3 tx0y1 = texture2D(tex, uv + vec2(-1,  0) / resolution.xy).rgb;
  vec3 tx0y2 = texture2D(tex, uv + vec2(-1,  1) / resolution.xy).rgb;
  vec3 tx1y0 = texture2D(tex, uv + vec2( 0, -1) / resolution.xy).rgb;
  vec3 tx1y1 = texture2D(tex, uv + vec2( 0,  0) / resolution.xy).rgb;
  vec3 tx1y2 = texture2D(tex, uv + vec2( 0,  1) / resolution.xy).rgb;
  vec3 tx2y0 = texture2D(tex, uv + vec2( 1, -1) / resolution.xy).rgb;
  vec3 tx2y1 = texture2D(tex, uv + vec2( 1,  0) / resolution.xy).rgb;
  vec3 tx2y2 = texture2D(tex, uv + vec2( 1,  1) / resolution.xy).rgb;

  vec3 Sx = Gx[0][0] * tx0y0 + Gx[1][0] * tx1y0 + Gx[2][0] * tx2y0 +
            Gx[0][1] * tx0y1 + Gx[1][1] * tx1y1 + Gx[2][1] * tx2y1 +
            Gx[0][2] * tx0y2 + Gx[1][2] * tx1y2 + Gx[2][2] * tx2y2;

  vec3 Sy = Gy[0][0] * tx0y0 + Gy[1][0] * tx1y0 + Gy[2][0] * tx2y0 +
            Gy[0][1] * tx0y1 + Gy[1][1] * tx1y1 + Gy[2][1] * tx2y1 +
            Gy[0][2] * tx0y2 + Gy[1][2] * tx1y2 + Gy[2][2] * tx2y2;

  return vec4(dot(Sx, Sx), dot(Sy, Sy), dot(Sx, Sy), 1.0);
}

void main() {
  gl_FragColor = computeStructureTensor(inputBuffer, vUv);
}
`;

// ── Pass 2: Anisotropic Kuwahara filter with polynomial weighting ───────────
const KUWAHARA_FRAGMENT = /* glsl */ `
#define SECTOR_COUNT 8

uniform int radius;
uniform float alpha;
uniform sampler2D inputBuffer;
uniform vec4 resolution;
uniform sampler2D originalTexture;

varying vec2 vUv;

vec4 fromLinear(vec4 linearRGB) {
  bvec3 cutoff = lessThan(linearRGB.rgb, vec3(0.0031308));
  vec3 higher = vec3(1.055) * pow(linearRGB.rgb, vec3(1.0 / 2.4)) - vec3(0.055);
  vec3 lower = linearRGB.rgb * vec3(12.92);
  return vec4(mix(higher, lower, cutoff), linearRGB.a);
}

vec3 sampleColor(vec2 offset) {
  vec2 coord = (gl_FragCoord.xy + offset) / resolution.xy;
  return texture2D(originalTexture, coord).rgb;
}

vec4 getDominantOrientation(vec4 tensor) {
  float Jxx = tensor.r;
  float Jyy = tensor.g;
  float Jxy = tensor.b;

  float trace = Jxx + Jyy;
  float det = Jxx * Jyy - Jxy * Jxy;

  float lambda1 = trace * 0.5 + sqrt(trace * trace * 0.25 - det);
  float lambda2 = trace * 0.5 - sqrt(trace * trace * 0.25 - det);

  float jxyStrength = abs(Jxy) / (abs(Jxx) + abs(Jyy) + abs(Jxy) + 1e-6);

  vec2 v;
  if (jxyStrength > 0.0) {
    v = normalize(vec2(-Jxy, Jxx - lambda1));
  } else {
    v = vec2(0.0, 1.0);
  }

  return vec4(normalize(v), lambda1, lambda2);
}

float polynomialWeight(float x, float y, float eta, float lambda) {
  float polyValue = (x + eta) - lambda * (y * y);
  return max(0.0, polyValue * polyValue);
}

void getSectorVarianceAndAverageColor(
  mat2 anisotropyMat, float angle, float rad,
  out vec3 avgColor, out float variance
) {
  vec3 weightedColorSum = vec3(0.0);
  vec3 weightedSquaredColorSum = vec3(0.0);
  float totalWeight = 0.0;

  float eta = 0.1;
  float lambda = 0.5;

  for (float r = 1.0; r <= rad; r += 1.0) {
    for (float a = -0.392699; a <= 0.392699; a += 0.196349) {
      vec2 sampleOffset = r * vec2(cos(angle + a), sin(angle + a));
      sampleOffset *= anisotropyMat;

      vec3 color = sampleColor(sampleOffset);
      float weight = polynomialWeight(sampleOffset.x, sampleOffset.y, eta, lambda);

      weightedColorSum += color * weight;
      weightedSquaredColorSum += color * color * weight;
      totalWeight += weight;
    }
  }

  avgColor = weightedColorSum / totalWeight;
  vec3 varianceRes = (weightedSquaredColorSum / totalWeight) - (avgColor * avgColor);
  variance = dot(varianceRes, vec3(0.299, 0.587, 0.114));
}

void main() {
  vec4 structureTensor = texture2D(inputBuffer, vUv);

  vec3 sectorAvgColors[SECTOR_COUNT];
  float sectorVariances[SECTOR_COUNT];

  vec4 oaResult = getDominantOrientation(structureTensor);
  vec2 orientation = oaResult.xy;

  float anisotropy = (oaResult.z - oaResult.w) / (oaResult.z + oaResult.w + 1e-6);

  float scaleX = alpha / (anisotropy + alpha);
  float scaleY = (anisotropy + alpha) / alpha;

  mat2 anisotropyMat = mat2(
    orientation.x, -orientation.y,
    orientation.y,  orientation.x
  ) * mat2(scaleX, 0.0, 0.0, scaleY);

  for (int i = 0; i < SECTOR_COUNT; i++) {
    float angle = float(i) * 6.28318 / float(SECTOR_COUNT);
    getSectorVarianceAndAverageColor(
      anisotropyMat, angle, float(radius),
      sectorAvgColors[i], sectorVariances[i]
    );
  }

  float minVariance = sectorVariances[0];
  vec3 finalColor = sectorAvgColors[0];

  for (int i = 1; i < SECTOR_COUNT; i++) {
    if (sectorVariances[i] < minVariance) {
      minVariance = sectorVariances[i];
      finalColor = sectorAvgColors[i];
    }
  }

  gl_FragColor = fromLinear(vec4(finalColor, 1.0));
}
`;

// ── Pass 3: Color correction, quantization, ACES tonemapping, paper texture ─
const FINAL_FRAGMENT = /* glsl */ `
uniform sampler2D inputBuffer;
uniform sampler2D watercolorTexture;
uniform int quantizeLevels;
uniform float saturation;
uniform float paperStrength;
varying vec2 vUv;

vec3 ACESFilm(vec3 x) {
  float a = 2.51;
  float b = 0.03;
  float c = 2.43;
  float d = 0.59;
  float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

vec3 sat(vec3 rgb, float adjustment) {
  vec3 W = vec3(0.2125, 0.7154, 0.0721);
  vec3 intensity = vec3(dot(rgb, W));
  return mix(intensity, rgb, adjustment);
}

void main() {
  vec3 color = texture2D(inputBuffer, vUv).rgb;
  vec4 watercolorColor = texture2D(watercolorTexture, vUv);
  vec3 grayscale = vec3(dot(color, vec3(0.299, 0.587, 0.114)));

  // Color quantization
  int n = quantizeLevels;
  float x = grayscale.r;
  float qn = floor(x * float(n - 1) + 0.5) / float(n - 1);
  qn = clamp(qn, 0.2, 0.7);

  // Two-point color interpolation
  if (qn < 0.5) {
    color = mix(vec3(0.1), color.rgb, qn * 2.0);
  } else {
    color = mix(color.rgb, vec3(1.0), (qn - 0.5) * 2.0);
  }

  color = sat(color, saturation);
  color = ACESFilm(color);

  vec4 outputColor = vec4(color, 1.0);
  outputColor = mix(outputColor, outputColor * watercolorColor, paperStrength);

  gl_FragColor = outputColor;
}
`;

// ── Helpers ─────────────────────────────────────────────────────────────────
function makePassScene(geometry, fragmentShader, uniforms) {
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: FULLSCREEN_VERTEX,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(mesh);
  return { scene, material };
}

// ── Component ───────────────────────────────────────────────────────────────
export default function PainterlyPostProcessing({
  radius = 6,
  alpha = 25,
  quantizeLevels = 16,
  saturation = 1.5,
  paperStrength = 1.0,
}) {
  const { size } = useThree();
  const resolutionRef = useRef(new THREE.Vector4());

  const paperTexture = useTexture('/images/watercolor.png');
  paperTexture.minFilter = THREE.LinearMipmapLinearFilter;
  paperTexture.magFilter = THREE.LinearFilter;
  paperTexture.generateMipmaps = true;

  // Render targets
  const originalTarget = useFBO({ depthBuffer: false });
  const tensorTarget = useFBO({
    depthBuffer: false,
    type: THREE.HalfFloatType,
  });
  const kuwaharaTarget = useFBO({ depthBuffer: false });

  // Shared fullscreen geometry + camera (created once)
  const fsCamera = useMemo(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
    []
  );
  const fsGeometry = useMemo(() => new THREE.PlaneGeometry(2, 2), []);

  // Pass scenes (created once, uniforms updated each frame)
  const tensorPass = useMemo(
    () =>
      makePassScene(fsGeometry, TENSOR_FRAGMENT, {
        inputBuffer: { value: null },
        resolution: { value: new THREE.Vector4() },
      }),
    [fsGeometry]
  );

  const kuwaharaPass = useMemo(
    () =>
      makePassScene(fsGeometry, KUWAHARA_FRAGMENT, {
        inputBuffer: { value: null },
        originalTexture: { value: null },
        resolution: { value: new THREE.Vector4() },
        radius: { value: radius },
        alpha: { value: alpha },
      }),
    [fsGeometry]
  );

  const finalPass = useMemo(
    () =>
      makePassScene(fsGeometry, FINAL_FRAGMENT, {
        inputBuffer: { value: null },
        watercolorTexture: { value: null },
        quantizeLevels: { value: quantizeLevels },
        saturation: { value: saturation },
        paperStrength: { value: paperStrength },
      }),
    [fsGeometry]
  );

  // Render pipeline — runs after the default R3F render at priority 1
  useFrame((state) => {
    const { gl, scene, camera } = state;
    const dpr = gl.getPixelRatio();
    const w = size.width * dpr;
    const h = size.height * dpr;
    resolutionRef.current.set(w, h, 1 / w, 1 / h);

    const prevAutoClear = gl.autoClear;
    gl.autoClear = false;

    // 1 — Capture original scene to FBO
    gl.setRenderTarget(originalTarget);
    gl.clear();
    gl.render(scene, camera);

    // 2 — Tensor pass: scene → structure tensor
    tensorPass.material.uniforms.inputBuffer.value = originalTarget.texture;
    tensorPass.material.uniforms.resolution.value = resolutionRef.current;
    gl.setRenderTarget(tensorTarget);
    gl.clear();
    gl.render(tensorPass.scene, fsCamera);

    // 3 — Anisotropic Kuwahara pass: tensor + original → filtered output
    kuwaharaPass.material.uniforms.inputBuffer.value = tensorTarget.texture;
    kuwaharaPass.material.uniforms.originalTexture.value =
      originalTarget.texture;
    kuwaharaPass.material.uniforms.resolution.value = resolutionRef.current;
    kuwaharaPass.material.uniforms.radius.value = radius;
    kuwaharaPass.material.uniforms.alpha.value = alpha;
    gl.setRenderTarget(kuwaharaTarget);
    gl.clear();
    gl.render(kuwaharaPass.scene, fsCamera);

    // 4 — Final pass: color correction + paper texture → screen
    finalPass.material.uniforms.inputBuffer.value = kuwaharaTarget.texture;
    finalPass.material.uniforms.watercolorTexture.value = paperTexture;
    finalPass.material.uniforms.quantizeLevels.value = quantizeLevels;
    finalPass.material.uniforms.saturation.value = saturation;
    finalPass.material.uniforms.paperStrength.value = paperStrength;
    gl.setRenderTarget(null);
    gl.clear();
    gl.render(finalPass.scene, fsCamera);

    gl.autoClear = prevAutoClear;
  }, 1);

  return null;
}
