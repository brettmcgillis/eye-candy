/* eslint-disable no-plusplus */
import * as THREE from 'three';

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import {
  DEBUG_CONTACT_CAP,
  FLUID_PRESETS,
  RANDOM_BURST_COUNT,
} from './fluidPresets';
import useFluidControls from './useFluidControls';

const simVertexShader = `
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform vec2 uTexel;

void main() {
  vUv = uv;
  vL = vUv - vec2(uTexel.x, 0.0);
  vR = vUv + vec2(uTexel.x, 0.0);
  vT = vUv + vec2(0.0, uTexel.y);
  vB = vUv - vec2(0.0, uTexel.y);
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fullscreenVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const displayVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const advectionFragmentShader = `
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uTexel;
uniform float uDt;
uniform float uDissipation;
uniform bool uManualFiltering;

vec4 bilerp(sampler2D sam, vec2 coord) {
  vec2 st = coord / uTexel - 0.5;
  vec2 iuv = floor(st);
  vec2 fuv = fract(st);

  vec2 aUv = (iuv + vec2(0.5, 0.5)) * uTexel;
  vec2 bUv = (iuv + vec2(1.5, 0.5)) * uTexel;
  vec2 cUv = (iuv + vec2(0.5, 1.5)) * uTexel;
  vec2 dUv = (iuv + vec2(1.5, 1.5)) * uTexel;

  vec4 a = texture2D(sam, aUv);
  vec4 b = texture2D(sam, bUv);
  vec4 c = texture2D(sam, cUv);
  vec4 d = texture2D(sam, dUv);

  return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
}

void main() {
  vec2 coord;
  vec4 result;

  if (uManualFiltering) {
    coord = vUv - uDt * bilerp(uVelocity, vUv).xy * uTexel;
    result = bilerp(uSource, coord);
  } else {
    coord = vUv - uDt * texture2D(uVelocity, vUv).xy * uTexel;
    result = texture2D(uSource, coord);
  }

  float decay = 1.0 + uDissipation * uDt;
  gl_FragColor = result / decay;
}
`;

const divergenceFragmentShader = `
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uVelocity;

void main() {
  vec2 C = texture2D(uVelocity, vUv).xy;

  float L = texture2D(uVelocity, vL).x;
  float R = texture2D(uVelocity, vR).x;
  float B = texture2D(uVelocity, vB).y;
  float T = texture2D(uVelocity, vT).y;

  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vB.y < 0.0) B = -C.y;
  if (vT.y > 1.0) T = -C.y;

  float div = 0.5 * (R - L + T - B);
  gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}
`;

const clearFragmentShader = `
varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uValue;

void main() {
  gl_FragColor = uValue * texture2D(uTexture, vUv);
}
`;

const pressureFragmentShader = `
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;

void main() {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float B = texture2D(uPressure, vB).x;
  float T = texture2D(uPressure, vT).x;
  float div = texture2D(uDivergence, vUv).x;

  float p = (L + R + B + T - div) * 0.25;
  gl_FragColor = vec4(p, 0.0, 0.0, 1.0);
}
`;

const gradientSubtractFragmentShader = `
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;

void main() {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float B = texture2D(uPressure, vB).x;
  float T = texture2D(uPressure, vT).x;

  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity -= vec2(R - L, T - B);

  gl_FragColor = vec4(velocity, 0.0, 1.0);
}
`;

const curlFragmentShader = `
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uVelocity;

void main() {
  float L = texture2D(uVelocity, vL).y;
  float R = texture2D(uVelocity, vR).y;
  float B = texture2D(uVelocity, vB).x;
  float T = texture2D(uVelocity, vT).x;
  float vorticity = R - L - T + B;
  gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}
`;

const vorticityFragmentShader = `
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uVelocity;
uniform sampler2D uCurlTex;
uniform float uDt;
uniform float uCurl;

void main() {
  float L = texture2D(uCurlTex, vL).x;
  float R = texture2D(uCurlTex, vR).x;
  float B = texture2D(uCurlTex, vB).x;
  float T = texture2D(uCurlTex, vT).x;
  float C = texture2D(uCurlTex, vUv).x;

  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= uCurl * C;
  force.y *= -1.0;

  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity += force * uDt;
  velocity = clamp(velocity, vec2(-1000.0), vec2(1000.0));

  gl_FragColor = vec4(velocity, 0.0, 1.0);
}
`;

const splatFragmentShader = `
varying vec2 vUv;
uniform sampler2D uTarget;
uniform vec2 uPoint;
uniform vec3 uColor;
uniform float uRadius;
uniform float uAspect;

void main() {
  vec3 base = texture2D(uTarget, vUv).xyz;
  vec2 p = vUv - uPoint;
  p.x *= uAspect;
  vec3 splat = exp(-dot(p, p) / max(uRadius, 0.00001)) * uColor;
  gl_FragColor = vec4(base + splat, 1.0);
}
`;

const bloomPrefilterFragmentShader = `
varying vec2 vUv;
uniform sampler2D uTexture;
uniform vec3 uCurve;
uniform float uThreshold;

void main() {
  vec3 c = texture2D(uTexture, vUv).rgb;
  float br = max(c.r, max(c.g, c.b));
  float rq = clamp(br - uCurve.x, 0.0, uCurve.y);
  rq = uCurve.z * rq * rq;
  c *= max(rq, br - uThreshold) / max(br, 0.0001);
  gl_FragColor = vec4(c, 1.0);
}
`;

const bloomBlurFragmentShader = `
varying vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 uTexel;

void main() {
  vec4 sum = vec4(0.0);
  sum += texture2D(uTexture, vUv + vec2(uTexel.x, 0.0));
  sum += texture2D(uTexture, vUv - vec2(uTexel.x, 0.0));
  sum += texture2D(uTexture, vUv + vec2(0.0, uTexel.y));
  sum += texture2D(uTexture, vUv - vec2(0.0, uTexel.y));
  gl_FragColor = sum * 0.25;
}
`;

const bloomFinalFragmentShader = `
varying vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 uTexel;
uniform float uIntensity;

void main() {
  vec4 sum = vec4(0.0);
  sum += texture2D(uTexture, vUv + vec2(uTexel.x, 0.0));
  sum += texture2D(uTexture, vUv - vec2(uTexel.x, 0.0));
  sum += texture2D(uTexture, vUv + vec2(0.0, uTexel.y));
  sum += texture2D(uTexture, vUv - vec2(0.0, uTexel.y));
  gl_FragColor = sum * 0.25 * uIntensity;
}
`;

const bloomComposeFragmentShader = `
varying vec2 vUv;
uniform sampler2D uBase;
uniform sampler2D uAdd;
uniform float uAddFactor;

void main() {
  vec3 base = texture2D(uBase, vUv).rgb;
  vec3 add = texture2D(uAdd, vUv).rgb;
  gl_FragColor = vec4(base + add * uAddFactor, 1.0);
}
`;

const sunraysMaskFragmentShader = `
varying vec2 vUv;
uniform sampler2D uTexture;

void main() {
  vec4 c = texture2D(uTexture, vUv);
  float br = max(c.r, max(c.g, c.b));
  c.a = 1.0 - min(max(br * 20.0, 0.0), 0.8);
  gl_FragColor = c;
}
`;

const sunraysFragmentShader = `
varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uWeight;

#define ITERATIONS 16

void main() {
  float Density = 0.3;
  float Decay = 0.95;
  float Exposure = 0.7;

  vec2 coord = vUv;
  vec2 dir = (vUv - 0.5) * (1.0 / float(ITERATIONS) * Density);

  float illuminationDecay = 1.0;
  float color = texture2D(uTexture, vUv).a;

  for (int i = 0; i < ITERATIONS; i++) {
    coord -= dir;
    float col = texture2D(uTexture, coord).a;
    color += col * illuminationDecay * uWeight;
    illuminationDecay *= Decay;
  }

  gl_FragColor = vec4(color * Exposure, 0.0, 0.0, 1.0);
}
`;

const blurFragmentShader = `
varying vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 uTexel;

void main() {
  float offset = 1.3333333;
  vec4 sum = texture2D(uTexture, vUv) * 0.29411764;
  sum += texture2D(uTexture, vUv - uTexel * offset) * 0.35294117;
  sum += texture2D(uTexture, vUv + uTexel * offset) * 0.35294117;
  gl_FragColor = sum;
}
`;

const displayFragmentShader = `
varying vec2 vUv;
uniform sampler2D uDye;
uniform sampler2D uBloom;
uniform sampler2D uSunrays;
uniform sampler2D uDithering;
uniform vec2 uDyeTexel;
uniform vec2 uDitherScale;
uniform vec3 uBgA;
uniform vec3 uBgB;
uniform float uBrightness;
uniform float uContrast;
uniform float uSaturation;
uniform bool uShading;
uniform bool uBloomEnabled;
uniform bool uSunraysEnabled;
uniform bool uDebugCursor;
uniform vec2 uDebugPointer;
uniform vec2 uDebugAuto;
uniform float uDebugPointerSize;
uniform float uDebugAutoSize;
uniform float uDebugPointerActive;
uniform float uDebugAutoActive;
uniform vec3 uDebugPointerColor;
uniform vec3 uDebugAutoColor;
#define DEBUG_CONTACT_CAP 12
uniform vec2 uDebugContacts[DEBUG_CONTACT_CAP];
uniform float uDebugContactLife[DEBUG_CONTACT_CAP];
uniform float uDebugContactKind[DEBUG_CONTACT_CAP];
uniform float uDebugContactFadeDuration;

vec3 linearToGamma(vec3 color) {
  color = max(color, vec3(0.0));
  return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0.0));
}

vec3 saturateColor(vec3 col, float amount) {
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  return mix(vec3(l), col, amount);
}

float squareOutline(vec2 uv, vec2 center, float halfSize, float thickness) {
  vec2 p = abs(uv - center);
  float outer = step(p.x, halfSize) * step(p.y, halfSize);
  float innerSize = max(halfSize - thickness, 0.0);
  float inner = step(p.x, innerSize) * step(p.y, innerSize);
  return clamp(outer - inner, 0.0, 1.0);
}

void main() {
  vec3 c = texture2D(uDye, vUv).rgb;

  if (uShading) {
    vec3 lc = texture2D(uDye, vUv - vec2(uDyeTexel.x, 0.0)).rgb;
    vec3 rc = texture2D(uDye, vUv + vec2(uDyeTexel.x, 0.0)).rgb;
    vec3 tc = texture2D(uDye, vUv + vec2(0.0, uDyeTexel.y)).rgb;
    vec3 bc = texture2D(uDye, vUv - vec2(0.0, uDyeTexel.y)).rgb;

    float dx = length(rc) - length(lc);
    float dy = length(tc) - length(bc);

    vec3 n = normalize(vec3(dx, dy, length(uDyeTexel)));
    vec3 l = vec3(0.0, 0.0, 1.0);
    float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
    c *= diffuse;
  }

  if (uSunraysEnabled) {
    float rays = texture2D(uSunrays, vUv).r;
    c *= rays;
  }

  if (uBloomEnabled) {
    vec3 bloom = texture2D(uBloom, vUv).rgb;
    float noise = texture2D(uDithering, vUv * uDitherScale).r * 2.0 - 1.0;
    bloom += noise / 255.0;
    bloom = linearToGamma(bloom);

    if (uSunraysEnabled) {
      bloom *= texture2D(uSunrays, vUv).r;
    }

    c += bloom;
  }

  vec3 bg = mix(uBgA, uBgB, smoothstep(0.0, 1.0, vUv.y));
  vec3 color = bg + c;

  color = saturateColor(color, uSaturation);
  color = (color - 0.5) * uContrast + 0.5;
  color *= uBrightness;

  if (uDebugCursor) {
    float pointerThickness = max(0.00035, uDebugPointerSize * 0.04);
    float autoThickness = max(0.00035, uDebugAutoSize * 0.04);
    float pointerSquare = squareOutline(
      vUv,
      uDebugPointer,
      uDebugPointerSize,
      pointerThickness
    ) * uDebugPointerActive;
    float autoSquare = squareOutline(
      vUv,
      uDebugAuto,
      uDebugAutoSize,
      autoThickness
    ) * uDebugAutoActive;

    color = mix(color, uDebugPointerColor, pointerSquare);
    color = mix(color, uDebugAutoColor, autoSquare);

    for (int i = 0; i < DEBUG_CONTACT_CAP; i++) {
      float contactActive = clamp(
        uDebugContactLife[i] / max(uDebugContactFadeDuration, 0.0001),
        0.0,
        1.0
      );
      float kind = clamp(uDebugContactKind[i], 0.0, 1.0);
      float size = mix(uDebugAutoSize, uDebugPointerSize, kind);
      float thickness = mix(autoThickness, pointerThickness, kind);
      vec3 markColor = mix(uDebugAutoColor, uDebugPointerColor, kind);
      float mark =
        squareOutline(vUv, uDebugContacts[i], size, thickness) * contactActive;
      color = mix(color, markColor, mark);
    }
  }

  gl_FragColor = vec4(color, 1.0);
}
`;

function createSimMaterial(fragmentShader, uniforms) {
  return new THREE.ShaderMaterial({
    vertexShader: simVertexShader,
    fragmentShader,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });
}

function createFullscreenMaterial(fragmentShader, uniforms) {
  return new THREE.ShaderMaterial({
    vertexShader: fullscreenVertexShader,
    fragmentShader,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });
}

function createPair(width, height, options) {
  const read = new THREE.WebGLRenderTarget(width, height, options);
  const write = new THREE.WebGLRenderTarget(width, height, options);

  return {
    read,
    write,
    swap() {
      const tmp = this.read;
      this.read = this.write;
      this.write = tmp;
    },
  };
}

function createBloomChain(width, height, iterations, options) {
  const chain = [];
  const count = Math.max(1, Math.floor(iterations));
  let w = width;
  let h = height;

  for (let i = 0; i < count; i++) {
    w = Math.max(2, Math.floor(w / 2));
    h = Math.max(2, Math.floor(h / 2));
    chain.push(new THREE.WebGLRenderTarget(w, h, options));
  }

  return chain;
}

function createDitheringTexture() {
  // Ordered 4x4 Bayer matrix, encoded to repeat as subtle bloom dither.
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const size = 4;
  const data = new Uint8Array(size * size * 4);

  for (let i = 0; i < bayer.length; i++) {
    const v = Math.floor((bayer[i] / 15) * 255);
    const idx = i * 4;
    data[idx] = v;
    data[idx + 1] = v;
    data[idx + 2] = v;
    data[idx + 3] = 255;
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

const PAVEL_DYE_COLOR_SCALE = 0.15;
const MAX_BLOOM_CHAIN = 16;
const MAX_SPLAT_VELOCITY = 900;

const FluidMaterial = forwardRef((_, ref) => {
  const { gl, size } = useThree();
  const pointerRef = useRef(null);
  const startedRef = useRef(false);
  const presetRef = useRef('default');
  const randomSplatQueueRef = useRef(0);
  const colorARef = useRef(new THREE.Color());
  const colorBRef = useRef(new THREE.Color());
  const colorCRef = useRef(new THREE.Color());
  const forceRef = useRef(new THREE.Vector3());
  const autoSplatColorRef = useRef(new THREE.Color());
  const autoSplatSeedRef = useRef(Math.random() * Math.PI * 2);
  const autoPointerRef = useRef({
    initialized: false,
    x: 0.5,
    y: 0.5,
    phase: Math.random() * Math.PI * 4,
  });
  const debugContactsRef = useRef(
    Array.from({ length: DEBUG_CONTACT_CAP }, () => ({
      x: 0.5,
      y: 0.5,
      ttl: 0,
      kind: 0,
    }))
  );
  const debugContactWriteRef = useRef(0);

  const [fluidValues, setControls] = useFluidControls({
    presetRef,
    randomSplatQueueRef,
  });

  const {
    paused,
    simResolution,
    pressureRelax,
    pressureIterations,
    vorticity,
    velocityDissipation,
    densityDissipation,
    splatRadius,
    splatForce,
    dyeStrength,
    autoSplat,
    autoSplatStrength,
    autoSplatRate,
    autoSplatBurst,
    shading,
    bloom,
    bloomResolution,
    bloomIterations,
    bloomIntensity,
    bloomThreshold,
    bloomSoftKnee,
    sunrays,
    sunraysResolution,
    sunraysWeight,
    colorA,
    colorB,
    colorC,
    colorful,
    colorUpdateSpeed,
    colorCycleSpeed,
    bgA,
    bgB,
    brightness,
    contrast,
    saturation,
    debugCursor,
    debugPointerColor,
    debugAutoColor,
    debugContactFadeDuration,
  } = fluidValues;

  useEffect(() => {
    const currentPresetKey = presetRef.current || 'default';
    const nextPreset = FLUID_PRESETS[currentPresetKey];
    if (nextPreset) setControls(nextPreset);
  }, [setControls]);

  const simWidth = Math.max(64, Math.floor(size.width * simResolution));
  const simHeight = Math.max(64, Math.floor(size.height * simResolution));

  const bloomWidth = Math.max(32, Math.floor(size.width * bloomResolution));
  const bloomHeight = Math.max(32, Math.floor(size.height * bloomResolution));

  const sunraysWidth = Math.max(32, Math.floor(size.width * sunraysResolution));
  const sunraysHeight = Math.max(
    32,
    Math.floor(size.height * sunraysResolution)
  );

  const type = gl.capabilities.isWebGL2
    ? THREE.HalfFloatType
    : THREE.UnsignedByteType;
  const filter = gl.capabilities.isWebGL2
    ? THREE.LinearFilter
    : THREE.NearestFilter;

  const rtOptions = useMemo(
    () => ({
      type,
      format: THREE.RGBAFormat,
      minFilter: filter,
      magFilter: filter,
      depthBuffer: false,
      stencilBuffer: false,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
    }),
    [filter, type]
  );

  const simTexel = useMemo(
    () => new THREE.Vector2(1 / simWidth, 1 / simHeight),
    [simWidth, simHeight]
  );

  const bloomTexel = useMemo(
    () => new THREE.Vector2(1 / bloomWidth, 1 / bloomHeight),
    [bloomWidth, bloomHeight]
  );

  const sunraysTexel = useMemo(
    () => new THREE.Vector2(1 / sunraysWidth, 1 / sunraysHeight),
    [sunraysWidth, sunraysHeight]
  );

  const simScene = useMemo(() => new THREE.Scene(), []);
  const simCamera = useMemo(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
    []
  );
  const simMesh = useMemo(
    () =>
      new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
      ),
    []
  );

  const velocity = useMemo(
    () => createPair(simWidth, simHeight, rtOptions),
    [simHeight, simWidth, rtOptions]
  );
  const dye = useMemo(
    () => createPair(simWidth, simHeight, rtOptions),
    [simHeight, simWidth, rtOptions]
  );
  const pressureTex = useMemo(
    () => createPair(simWidth, simHeight, rtOptions),
    [simHeight, simWidth, rtOptions]
  );
  const curl = useMemo(
    () => new THREE.WebGLRenderTarget(simWidth, simHeight, rtOptions),
    [simHeight, simWidth, rtOptions]
  );
  const divergence = useMemo(
    () => new THREE.WebGLRenderTarget(simWidth, simHeight, rtOptions),
    [simHeight, simWidth, rtOptions]
  );

  const bloomComposite = useMemo(
    () => createPair(bloomWidth, bloomHeight, rtOptions),
    [bloomHeight, bloomWidth, rtOptions]
  );
  const bloomChain = useMemo(
    () => createBloomChain(bloomWidth, bloomHeight, MAX_BLOOM_CHAIN, rtOptions),
    [bloomHeight, bloomWidth, rtOptions]
  );

  const sunraysMask = useMemo(
    () => new THREE.WebGLRenderTarget(sunraysWidth, sunraysHeight, rtOptions),
    [rtOptions, sunraysHeight, sunraysWidth]
  );
  const sunraysTex = useMemo(
    () => new THREE.WebGLRenderTarget(sunraysWidth, sunraysHeight, rtOptions),
    [rtOptions, sunraysHeight, sunraysWidth]
  );
  const sunraysTemp = useMemo(
    () => new THREE.WebGLRenderTarget(sunraysWidth, sunraysHeight, rtOptions),
    [rtOptions, sunraysHeight, sunraysWidth]
  );

  const advectionMat = useMemo(
    () =>
      createSimMaterial(advectionFragmentShader, {
        uVelocity: { value: null },
        uSource: { value: null },
        uTexel: { value: simTexel.clone() },
        uDt: { value: 0.016 },
        uDissipation: { value: densityDissipation },
        uManualFiltering: { value: filter === THREE.NearestFilter },
      }),
    [filter, simTexel]
  );

  const divergenceMat = useMemo(
    () =>
      createSimMaterial(divergenceFragmentShader, {
        uVelocity: { value: null },
        uTexel: { value: simTexel.clone() },
      }),
    [simTexel]
  );

  const clearMat = useMemo(
    () =>
      createFullscreenMaterial(clearFragmentShader, {
        uTexture: { value: null },
        uValue: { value: pressureRelax },
      }),
    [simTexel]
  );

  const pressureMat = useMemo(
    () =>
      createSimMaterial(pressureFragmentShader, {
        uPressure: { value: null },
        uDivergence: { value: null },
        uTexel: { value: simTexel.clone() },
      }),
    [simTexel]
  );

  const curlMat = useMemo(
    () =>
      createSimMaterial(curlFragmentShader, {
        uVelocity: { value: null },
        uTexel: { value: simTexel.clone() },
      }),
    [simTexel]
  );

  const gradientMat = useMemo(
    () =>
      createSimMaterial(gradientSubtractFragmentShader, {
        uPressure: { value: null },
        uVelocity: { value: null },
        uTexel: { value: simTexel.clone() },
      }),
    [simTexel]
  );

  const vorticityMat = useMemo(
    () =>
      createSimMaterial(vorticityFragmentShader, {
        uVelocity: { value: null },
        uCurlTex: { value: null },
        uTexel: { value: simTexel.clone() },
        uDt: { value: 0.016 },
        uCurl: { value: vorticity },
      }),
    [simTexel]
  );

  const splatMat = useMemo(
    () =>
      createFullscreenMaterial(splatFragmentShader, {
        uTarget: { value: null },
        uPoint: { value: new THREE.Vector2(0.5, 0.5) },
        uColor: { value: new THREE.Vector3(0, 0, 0) },
        uRadius: { value: splatRadius },
        uAspect: { value: simWidth / simHeight },
      }),
    [simHeight, simWidth]
  );

  const bloomPrefilterMat = useMemo(
    () =>
      createFullscreenMaterial(bloomPrefilterFragmentShader, {
        uTexture: { value: null },
        uCurve: { value: new THREE.Vector3(0, 0, 0) },
        uThreshold: { value: bloomThreshold },
      }),
    [bloomTexel]
  );

  const bloomBlurMat = useMemo(
    () =>
      createFullscreenMaterial(bloomBlurFragmentShader, {
        uTexture: { value: null },
        uTexel: { value: bloomTexel.clone() },
      }),
    [bloomTexel]
  );

  const bloomFinalMat = useMemo(
    () =>
      createFullscreenMaterial(bloomFinalFragmentShader, {
        uTexture: { value: null },
        uTexel: { value: bloomTexel.clone() },
        uIntensity: { value: bloomIntensity },
      }),
    [bloomTexel]
  );

  const bloomComposeMat = useMemo(
    () =>
      createFullscreenMaterial(bloomComposeFragmentShader, {
        uBase: { value: null },
        uAdd: { value: null },
        uAddFactor: { value: 1 },
      }),
    [bloomTexel]
  );

  const sunraysMaskMat = useMemo(
    () =>
      createFullscreenMaterial(sunraysMaskFragmentShader, {
        uTexture: { value: null },
      }),
    [sunraysTexel]
  );

  const sunraysMat = useMemo(
    () =>
      createFullscreenMaterial(sunraysFragmentShader, {
        uTexture: { value: null },
        uWeight: { value: sunraysWeight },
      }),
    [sunraysTexel]
  );

  const blurMat = useMemo(
    () =>
      createFullscreenMaterial(blurFragmentShader, {
        uTexture: { value: null },
        uTexel: { value: new THREE.Vector2(1, 0) },
      }),
    [sunraysTexel]
  );

  const displayMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: displayVertexShader,
        fragmentShader: displayFragmentShader,
        uniforms: {
          uDye: { value: null },
          uBloom: { value: null },
          uSunrays: { value: null },
          uDithering: { value: null },
          uDyeTexel: { value: simTexel.clone() },
          uDitherScale: { value: new THREE.Vector2(1, 1) },
          uBgA: { value: new THREE.Color(bgA) },
          uBgB: { value: new THREE.Color(bgB) },
          uBrightness: { value: brightness },
          uContrast: { value: contrast },
          uSaturation: { value: saturation },
          uShading: { value: shading },
          uBloomEnabled: { value: bloom },
          uSunraysEnabled: { value: sunrays },
          uDebugCursor: { value: false },
          uDebugPointer: { value: new THREE.Vector2(0.5, 0.5) },
          uDebugAuto: { value: new THREE.Vector2(0.5, 0.5) },
          uDebugPointerSize: { value: 0.03 },
          uDebugAutoSize: { value: 0.03 },
          uDebugPointerActive: { value: 0 },
          uDebugAutoActive: { value: 0 },
          uDebugPointerColor: {
            value: new THREE.Color(FLUID_PRESETS.default.debugPointerColor),
          },
          uDebugAutoColor: {
            value: new THREE.Color(FLUID_PRESETS.default.debugAutoColor),
          },
          uDebugContacts: {
            value: Array.from(
              { length: DEBUG_CONTACT_CAP },
              () => new THREE.Vector2(0.5, 0.5)
            ),
          },
          uDebugContactLife: {
            value: Array.from({ length: DEBUG_CONTACT_CAP }, () => 0),
          },
          uDebugContactKind: {
            value: Array.from({ length: DEBUG_CONTACT_CAP }, () => 0),
          },
          uDebugContactFadeDuration: {
            value: FLUID_PRESETS.default.debugContactFadeDuration,
          },
        },
        depthTest: false,
        depthWrite: false,
      }),
    [simTexel]
  );
  const ditheringTexture = useMemo(() => createDitheringTexture(), []);

  useEffect(() => {
    simScene.add(simMesh);
    return () => {
      simScene.remove(simMesh);
    };
  }, [simMesh, simScene]);

  useEffect(() => {
    const clearTarget = (target) => {
      gl.setRenderTarget(target);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    };

    clearTarget(velocity.read);
    clearTarget(velocity.write);
    clearTarget(dye.read);
    clearTarget(dye.write);
    clearTarget(pressureTex.read);
    clearTarget(pressureTex.write);
    clearTarget(curl);
    clearTarget(divergence);

    gl.setRenderTarget(null);

    return () => {
      velocity.read.dispose();
      velocity.write.dispose();
      dye.read.dispose();
      dye.write.dispose();
      pressureTex.read.dispose();
      pressureTex.write.dispose();
      curl.dispose();
      divergence.dispose();
    };
  }, [curl, divergence, dye, gl, pressureTex, velocity]);

  useEffect(() => {
    const clearTarget = (target) => {
      gl.setRenderTarget(target);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    };

    clearTarget(bloomComposite.read);
    clearTarget(bloomComposite.write);
    bloomChain.forEach(clearTarget);
    clearTarget(sunraysMask);
    clearTarget(sunraysTex);
    clearTarget(sunraysTemp);

    gl.setRenderTarget(null);

    return () => {
      bloomComposite.read.dispose();
      bloomComposite.write.dispose();
      bloomChain.forEach((target) => target.dispose());
      sunraysMask.dispose();
      sunraysTex.dispose();
      sunraysTemp.dispose();
    };
  }, [bloomComposite, gl, sunraysMask, sunraysTemp, sunraysTex, bloomChain]);

  useEffect(
    () => () => {
      simMesh.geometry.dispose();
      ditheringTexture.dispose();
      advectionMat.dispose();
      clearMat.dispose();
      curlMat.dispose();
      divergenceMat.dispose();
      pressureMat.dispose();
      gradientMat.dispose();
      vorticityMat.dispose();
      splatMat.dispose();
      bloomPrefilterMat.dispose();
      bloomBlurMat.dispose();
      bloomFinalMat.dispose();
      bloomComposeMat.dispose();
      sunraysMaskMat.dispose();
      sunraysMat.dispose();
      blurMat.dispose();
      displayMat.dispose();
    },
    [
      advectionMat,
      bloomBlurMat,
      bloomComposeMat,
      bloomFinalMat,
      bloomPrefilterMat,
      blurMat,
      clearMat,
      curlMat,
      divergenceMat,
      displayMat,
      ditheringTexture,
      gradientMat,
      pressureMat,
      simMesh.geometry,
      splatMat,
      sunraysMaskMat,
      sunraysMat,
      vorticityMat,
    ]
  );

  useImperativeHandle(ref, () => ({
    setPointer(next) {
      pointerRef.current = next;
    },
  }));

  useFrame((state) => {
    const dt = Math.min(0.033, state.clock.getDelta());
    const t = state.clock.elapsedTime;
    for (let i = 0; i < DEBUG_CONTACT_CAP; i++) {
      const contact = debugContactsRef.current[i];
      contact.ttl = Math.max(0, contact.ttl - dt);
    }

    const renderPass = (material, target) => {
      simMesh.material = material;
      gl.setRenderTarget(target);
      gl.render(simScene, simCamera);
    };

    colorARef.current.set(colorA);
    colorBRef.current.set(colorB);
    colorCRef.current.set(colorC);

    advectionMat.uniforms.uTexel.value.copy(simTexel);
    advectionMat.uniforms.uDt.value = dt;
    advectionMat.uniforms.uManualFiltering.value =
      filter === THREE.NearestFilter;

    divergenceMat.uniforms.uTexel.value.copy(simTexel);
    curlMat.uniforms.uTexel.value.copy(simTexel);

    vorticityMat.uniforms.uTexel.value.copy(simTexel);
    vorticityMat.uniforms.uDt.value = dt;
    vorticityMat.uniforms.uCurl.value = vorticity;

    pressureMat.uniforms.uTexel.value.copy(simTexel);
    clearMat.uniforms.uValue.value = pressureRelax;

    splatMat.uniforms.uRadius.value = splatRadius;
    splatMat.uniforms.uAspect.value = simWidth / simHeight;

    bloomPrefilterMat.uniforms.uThreshold.value = bloomThreshold;
    bloomBlurMat.uniforms.uTexel.value.copy(bloomTexel);
    bloomFinalMat.uniforms.uTexel.value.copy(bloomTexel);
    bloomFinalMat.uniforms.uIntensity.value = bloomIntensity;

    sunraysMat.uniforms.uWeight.value = sunraysWeight;

    displayMat.uniforms.uDyeTexel.value.copy(simTexel);
    displayMat.uniforms.uDithering.value = ditheringTexture;
    displayMat.uniforms.uDitherScale.value.set(
      size.width / ditheringTexture.image.width,
      size.height / ditheringTexture.image.height
    );
    displayMat.uniforms.uBgA.value.set(bgA);
    displayMat.uniforms.uBgB.value.set(bgB);
    displayMat.uniforms.uBrightness.value = brightness;
    displayMat.uniforms.uContrast.value = contrast;
    displayMat.uniforms.uSaturation.value = saturation;
    displayMat.uniforms.uShading.value = shading;
    displayMat.uniforms.uBloomEnabled.value = bloom;
    displayMat.uniforms.uSunraysEnabled.value = sunrays;

    const pointer = pointerRef.current;
    const debugContactFadeDurationSafe = Number.isFinite(
      debugContactFadeDuration
    )
      ? Math.max(0.05, debugContactFadeDuration)
      : FLUID_PRESETS.default.debugContactFadeDuration;

    if (!paused) {
      const autoSplatRateSafe = Number.isFinite(autoSplatRate)
        ? autoSplatRate
        : FLUID_PRESETS.default.autoSplatRate;
      const autoSplatBurstSafe = Number.isFinite(autoSplatBurst)
        ? autoSplatBurst
        : FLUID_PRESETS.default.autoSplatBurst;
      const autoSplatStrengthSafe = Number.isFinite(autoSplatStrength)
        ? autoSplatStrength
        : FLUID_PRESETS.default.autoSplatStrength;

      advectionMat.uniforms.uVelocity.value = velocity.read.texture;
      advectionMat.uniforms.uSource.value = velocity.read.texture;
      advectionMat.uniforms.uDissipation.value = velocityDissipation;
      renderPass(advectionMat, velocity.write);
      velocity.swap();

      curlMat.uniforms.uVelocity.value = velocity.read.texture;
      renderPass(curlMat, curl);

      vorticityMat.uniforms.uVelocity.value = velocity.read.texture;
      vorticityMat.uniforms.uCurlTex.value = curl.texture;
      renderPass(vorticityMat, velocity.write);
      velocity.swap();

      const splatAt = (px, py, vx, vy, rgb, strength = 1, debugKind = -1) => {
        if (
          !Number.isFinite(px) ||
          !Number.isFinite(py) ||
          !Number.isFinite(vx) ||
          !Number.isFinite(vy) ||
          !Number.isFinite(strength) ||
          !rgb ||
          !Number.isFinite(rgb.r) ||
          !Number.isFinite(rgb.g) ||
          !Number.isFinite(rgb.b)
        ) {
          return;
        }

        const safePx = THREE.MathUtils.clamp(px, 0, 1);
        const safePy = THREE.MathUtils.clamp(py, 0, 1);
        const safeStrength = THREE.MathUtils.clamp(strength, 0, 3);
        if (debugKind >= 0) {
          const idx = debugContactWriteRef.current;
          debugContactsRef.current[idx].x = safePx;
          debugContactsRef.current[idx].y = safePy;
          debugContactsRef.current[idx].ttl = debugContactFadeDurationSafe;
          debugContactsRef.current[idx].kind = debugKind > 0 ? 1 : 0;
          debugContactWriteRef.current = (idx + 1) % DEBUG_CONTACT_CAP;
        }

        splatMat.uniforms.uPoint.value.set(safePx, safePy);

        splatMat.uniforms.uTarget.value = velocity.read.texture;
        forceRef.current.set(
          THREE.MathUtils.clamp(vx, -MAX_SPLAT_VELOCITY, MAX_SPLAT_VELOCITY),
          THREE.MathUtils.clamp(vy, -MAX_SPLAT_VELOCITY, MAX_SPLAT_VELOCITY),
          0
        );
        splatMat.uniforms.uColor.value.copy(forceRef.current);
        renderPass(splatMat, velocity.write);
        velocity.swap();

        splatMat.uniforms.uTarget.value = dye.read.texture;
        forceRef.current
          .set(
            THREE.MathUtils.clamp(rgb.r, 0, 1),
            THREE.MathUtils.clamp(rgb.g, 0, 1),
            THREE.MathUtils.clamp(rgb.b, 0, 1)
          )
          .multiplyScalar(dyeStrength * safeStrength * PAVEL_DYE_COLOR_SCALE);
        splatMat.uniforms.uColor.value.copy(forceRef.current);
        renderPass(splatMat, dye.write);
        dye.swap();
      };

      if (pointer?.down) {
        const cycleSpeed = colorCycleSpeed * Math.max(0.001, colorUpdateSpeed);
        const mixAB = 0.5 + 0.5 * Math.sin(t * cycleSpeed);
        const mixBC = 0.5 + 0.5 * Math.sin(t * cycleSpeed * 1.37 + 1.7);

        if (colorful) {
          colorARef.current.lerp(colorBRef.current, mixAB);
          colorARef.current.lerp(colorCRef.current, mixBC * 0.45);
        }

        const speed = Math.min(
          1,
          Math.hypot(pointer.vx || 0, pointer.vy || 0) * 80
        );
        const forceX = (pointer.vx || 0) * splatForce;
        const forceY = (pointer.vy || 0) * splatForce;

        splatAt(
          pointer.x,
          pointer.y,
          forceX,
          forceY,
          colorful ? colorARef.current : colorARef.current.set(colorA),
          0.65 + speed * 0.75
        );
      } else if (!startedRef.current) {
        startedRef.current = true;
        splatAt(0.5, 0.5, 0, 0, colorARef.current.set(0.2, 0.4, 0.7), 0.35);
      }

      if (autoSplat) {
        const burstCount = Math.max(1, Math.floor(autoSplatBurstSafe));
        const rate = Math.max(0.5, autoSplatRateSafe);
        const pathSpeed =
          (0.9 + rate * 0.15) * (0.7 + Math.max(0, colorCycleSpeed) * 0.5);

        const sampleAutoCursor = (phase) => {
          const x =
            0.5 +
            Math.sin(phase * 0.97) * 0.26 +
            Math.sin(phase * 0.41 + 1.4) * 0.13 +
            Math.sin(phase * 1.81 + 0.3) * 0.05;
          const y =
            0.5 +
            Math.cos(phase * 1.13) * 0.24 +
            Math.cos(phase * 0.53 + 2.0) * 0.12 +
            Math.cos(phase * 1.47 + 0.9) * 0.05;

          return {
            x: THREE.MathUtils.clamp(x, 0.05, 0.95),
            y: THREE.MathUtils.clamp(y, 0.05, 0.95),
          };
        };

        autoPointerRef.current.phase += dt * pathSpeed;
        const phase = autoPointerRef.current.phase + autoSplatSeedRef.current;
        const target = sampleAutoCursor(phase);

        if (!autoPointerRef.current.initialized) {
          autoPointerRef.current.initialized = true;
          autoPointerRef.current.x = target.x;
          autoPointerRef.current.y = target.y;
        }

        const prevX = autoPointerRef.current.x;
        const prevY = autoPointerRef.current.y;
        const follow = THREE.MathUtils.clamp(
          0.22 + dt * (rate * 3.0),
          0.22,
          0.9
        );
        const nextX = THREE.MathUtils.lerp(prevX, target.x, follow);
        const nextY = THREE.MathUtils.lerp(prevY, target.y, follow);

        let dvx = nextX - prevX;
        let dvy = nextY - prevY;

        if (size.width > size.height) {
          dvx *= size.width / Math.max(1, size.height);
        } else {
          dvy *= size.height / Math.max(1, size.width);
        }

        const autoSpeed = Math.min(1, Math.hypot(dvx, dvy) * 140);
        const mobileForceFactor =
          FLUID_PRESETS.mobile.splatForce / Math.max(1, splatForce);
        const mobileDyeFactor =
          FLUID_PRESETS.mobile.dyeStrength / Math.max(0.001, dyeStrength);
        let autoForceX =
          dvx * splatForce * autoSplatStrengthSafe * mobileForceFactor * 1.4;
        let autoForceY =
          dvy * splatForce * autoSplatStrengthSafe * mobileForceFactor * 1.4;
        const minForce =
          splatForce * autoSplatStrengthSafe * mobileForceFactor * 0.0018;
        if (Math.hypot(autoForceX, autoForceY) < minForce) {
          autoForceX += Math.cos(phase * 1.9) * minForce;
          autoForceY += Math.sin(phase * 1.9) * minForce;
        }

        autoPointerRef.current.x = nextX;
        autoPointerRef.current.y = nextY;

        autoSplatColorRef.current
          .set(
            Math.min(
              1,
              THREE.MathUtils.lerp(
                colorARef.current.r,
                colorBRef.current.r,
                0.5 + 0.5 * Math.sin(phase * 0.61)
              ) + 0.01
            ),
            Math.min(
              1,
              THREE.MathUtils.lerp(
                colorBRef.current.g,
                colorCRef.current.g,
                0.5 + 0.5 * Math.sin(phase * 0.73 + 0.7)
              ) + 0.01
            ),
            Math.min(
              1,
              THREE.MathUtils.lerp(
                colorCRef.current.b,
                colorARef.current.b,
                0.5 + 0.5 * Math.sin(phase * 0.67 + 1.4)
              ) + 0.01
            )
          )
          .multiplyScalar(0.75);

        const autoStrength =
          (0.12 + autoSpeed * 0.2) *
          mobileDyeFactor *
          autoSplatStrengthSafe *
          0.75;
        splatAt(
          nextX,
          nextY,
          autoForceX,
          autoForceY,
          autoSplatColorRef.current,
          autoStrength
        );

        for (let i = 1; i < burstCount; i++) {
          const jitterPhase = phase + i * 1.73;
          const trailT = i / burstCount;
          const trailX = THREE.MathUtils.lerp(prevX, nextX, trailT);
          const trailY = THREE.MathUtils.lerp(prevY, nextY, trailT);
          const jitter = 0.006 * (i / Math.max(1, burstCount - 1));
          const jx = Math.sin(jitterPhase * 1.19) * jitter;
          const jy = Math.cos(jitterPhase * 1.47) * jitter;
          const decay = Math.max(0.12, 1 - i * 0.28);

          splatAt(
            trailX + jx,
            trailY + jy,
            autoForceX * decay,
            autoForceY * decay,
            autoSplatColorRef.current,
            autoStrength * decay * 0.55
          );
        }
      } else {
        autoPointerRef.current.initialized = false;
      }

      if (randomSplatQueueRef.current > 0) {
        const batch = Math.min(randomSplatQueueRef.current, RANDOM_BURST_COUNT);
        randomSplatQueueRef.current -= batch;
        for (let i = 0; i < batch; i++) {
          const px = Math.random();
          const py = Math.random();
          const vx = (Math.random() * 2 - 1) * splatForce * 0.08;
          const vy = (Math.random() * 2 - 1) * splatForce * 0.08;
          const hueMix = Math.random();
          const tint = colorARef.current
            .clone()
            .lerp(colorBRef.current, hueMix)
            .lerp(colorCRef.current, Math.random() * 0.5);
          splatAt(px, py, vx, vy, tint, 0.5 + Math.random() * 0.8, 0);
        }
      }

      divergenceMat.uniforms.uVelocity.value = velocity.read.texture;
      renderPass(divergenceMat, divergence);

      clearMat.uniforms.uTexture.value = pressureTex.read.texture;
      renderPass(clearMat, pressureTex.write);
      pressureTex.swap();

      pressureMat.uniforms.uDivergence.value = divergence.texture;
      for (let i = 0; i < pressureIterations; i++) {
        pressureMat.uniforms.uPressure.value = pressureTex.read.texture;
        renderPass(pressureMat, pressureTex.write);
        pressureTex.swap();
      }

      gradientMat.uniforms.uPressure.value = pressureTex.read.texture;
      gradientMat.uniforms.uVelocity.value = velocity.read.texture;
      renderPass(gradientMat, velocity.write);
      velocity.swap();

      advectionMat.uniforms.uVelocity.value = velocity.read.texture;
      advectionMat.uniforms.uSource.value = dye.read.texture;
      advectionMat.uniforms.uDissipation.value = densityDissipation;
      renderPass(advectionMat, dye.write);
      dye.swap();
    }

    const debugCursorSize = THREE.MathUtils.clamp(
      Math.sqrt(Math.max(splatRadius, 0.000001)) * 1.35,
      0.008,
      0.18
    );
    displayMat.uniforms.uDebugCursor.value = debugCursor;
    displayMat.uniforms.uDebugPointer.value.set(
      pointer?.x ?? 0.5,
      pointer?.y ?? 0.5
    );
    displayMat.uniforms.uDebugAuto.value.set(
      autoPointerRef.current.x,
      autoPointerRef.current.y
    );
    displayMat.uniforms.uDebugPointerSize.value = debugCursorSize;
    displayMat.uniforms.uDebugAutoSize.value = debugCursorSize;
    displayMat.uniforms.uDebugPointerActive.value = pointer?.down ? 1 : 0;
    displayMat.uniforms.uDebugAutoActive.value =
      autoSplat && autoPointerRef.current.initialized ? 1 : 0;
    displayMat.uniforms.uDebugPointerColor.value.set(debugPointerColor);
    displayMat.uniforms.uDebugAutoColor.value.set(debugAutoColor);
    displayMat.uniforms.uDebugContactFadeDuration.value =
      debugContactFadeDurationSafe;
    for (let i = 0; i < DEBUG_CONTACT_CAP; i++) {
      const contact = debugContactsRef.current[i];
      displayMat.uniforms.uDebugContacts.value[i].set(contact.x, contact.y);
      displayMat.uniforms.uDebugContactLife.value[i] = contact.ttl;
      displayMat.uniforms.uDebugContactKind.value[i] = contact.kind;
    }

    const bloomLevelCount = Math.min(
      bloomChain.length,
      Math.max(1, Math.floor(bloomIterations))
    );

    if (bloom && bloomLevelCount > 0) {
      const knee = bloomThreshold * bloomSoftKnee + 0.0001;
      bloomPrefilterMat.uniforms.uCurve.value.set(
        bloomThreshold - knee,
        knee * 2,
        0.25 / knee
      );
      bloomPrefilterMat.uniforms.uTexture.value = dye.read.texture;
      renderPass(bloomPrefilterMat, bloomChain[0]);

      for (let i = 1; i < bloomLevelCount; i++) {
        const src = bloomChain[i - 1];
        const dst = bloomChain[i];
        bloomBlurMat.uniforms.uTexel.value.set(1 / src.width, 1 / src.height);
        bloomBlurMat.uniforms.uTexture.value = src.texture;
        renderPass(bloomBlurMat, dst);
      }

      gl.setRenderTarget(bloomComposite.read);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      for (let i = bloomLevelCount - 1; i >= 0; i--) {
        bloomComposeMat.uniforms.uBase.value = bloomComposite.read.texture;
        bloomComposeMat.uniforms.uAdd.value = bloomChain[i].texture;
        bloomComposeMat.uniforms.uAddFactor.value =
          0.82 ** (bloomLevelCount - 1 - i);
        renderPass(bloomComposeMat, bloomComposite.write);
        bloomComposite.swap();
      }

      bloomFinalMat.uniforms.uTexel.value.copy(bloomTexel);
      bloomFinalMat.uniforms.uTexture.value = bloomComposite.read.texture;
      renderPass(bloomFinalMat, bloomComposite.write);
      bloomComposite.swap();

      displayMat.uniforms.uBloom.value = bloomComposite.read.texture;
    } else {
      displayMat.uniforms.uBloom.value = dye.read.texture;
    }

    if (sunrays) {
      sunraysMaskMat.uniforms.uTexture.value = dye.read.texture;
      renderPass(sunraysMaskMat, sunraysMask);

      sunraysMat.uniforms.uTexture.value = sunraysMask.texture;
      renderPass(sunraysMat, sunraysTex);

      blurMat.uniforms.uTexture.value = sunraysTex.texture;
      blurMat.uniforms.uTexel.value.set(sunraysTexel.x, 0);
      renderPass(blurMat, sunraysTemp);

      blurMat.uniforms.uTexture.value = sunraysTemp.texture;
      blurMat.uniforms.uTexel.value.set(0, sunraysTexel.y);
      renderPass(blurMat, sunraysTex);

      displayMat.uniforms.uSunrays.value = sunraysTex.texture;
    } else {
      displayMat.uniforms.uSunrays.value = dye.read.texture;
    }

    displayMat.uniforms.uDye.value = dye.read.texture;

    gl.setRenderTarget(null);
  });

  return <primitive object={displayMat} attach="material" />;
});

export default FluidMaterial;
