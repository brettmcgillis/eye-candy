/* eslint-disable no-plusplus */
import { button, folder, useControls } from 'leva';
import * as THREE from 'three';

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import { useFrame, useThree } from '@react-three/fiber';

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
uniform vec2 uDyeTexel;
uniform vec3 uBgA;
uniform vec3 uBgB;
uniform float uBrightness;
uniform float uContrast;
uniform float uSaturation;
uniform bool uShading;
uniform bool uBloomEnabled;
uniform bool uSunraysEnabled;

vec3 linearToGamma(vec3 color) {
  color = max(color, vec3(0.0));
  return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0.0));
}

vec3 saturateColor(vec3 col, float amount) {
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  return mix(vec3(l), col, amount);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
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
    float noise = hash12(vUv * vec2(1024.0, 1024.0)) * 2.0 - 1.0;
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

const FLUID_PRESETS = {
  default: {
    paused: false,
    simResolution: 0.65,
    pressureRelax: 0.8,
    pressureIterations: 20,
    vorticity: 30,
    velocityDissipation: 0.2,
    densityDissipation: 1,
    splatRadius: 0.003,
    splatForce: 6000,
    dyeStrength: 0.55,
    autoSplat: false,
    autoSplatStrength: 0.2,
    shading: true,
    bloom: true,
    bloomResolution: 0.25,
    bloomIterations: 8,
    bloomIntensity: 0.8,
    bloomThreshold: 0.6,
    bloomSoftKnee: 0.7,
    sunrays: true,
    sunraysResolution: 0.18,
    sunraysWeight: 1,
    colorA: '#1ed8ff',
    colorB: '#ff6bd6',
    colorC: '#8eff70',
    colorful: true,
    colorUpdateSpeed: 10,
    colorCycleSpeed: 0.8,
    bgA: '#000000',
    bgB: '#090012',
    brightness: 1.08,
    contrast: 1.2,
    saturation: 1.25,
  },
  pavelLike: {
    paused: false,
    simResolution: 0.75,
    pressureRelax: 0.8,
    pressureIterations: 28,
    vorticity: 42,
    velocityDissipation: 0.18,
    densityDissipation: 1,
    splatRadius: 0.0028,
    splatForce: 7000,
    dyeStrength: 0.85,
    autoSplat: false,
    autoSplatStrength: 0.25,
    shading: true,
    bloom: true,
    bloomResolution: 0.25,
    bloomIterations: 10,
    bloomIntensity: 0.95,
    bloomThreshold: 0.58,
    bloomSoftKnee: 0.7,
    sunrays: true,
    sunraysResolution: 0.2,
    sunraysWeight: 1,
    colorA: '#1de9ff',
    colorB: '#ff4ccf',
    colorC: '#ffd35e',
    colorful: true,
    colorUpdateSpeed: 12,
    colorCycleSpeed: 1.2,
    bgA: '#000000',
    bgB: '#0a0017',
    brightness: 1.12,
    contrast: 1.3,
    saturation: 1.4,
  },
  mobile: {
    paused: false,
    simResolution: 0.42,
    pressureRelax: 0.84,
    pressureIterations: 14,
    vorticity: 24,
    velocityDissipation: 0.24,
    densityDissipation: 1,
    splatRadius: 0.0022,
    splatForce: 4200,
    dyeStrength: 0.5,
    autoSplat: false,
    autoSplatStrength: 0.1,
    shading: false,
    bloom: false,
    bloomResolution: 0.2,
    bloomIterations: 4,
    bloomIntensity: 0.65,
    bloomThreshold: 0.62,
    bloomSoftKnee: 0.7,
    sunrays: false,
    sunraysResolution: 0.16,
    sunraysWeight: 0.9,
    colorA: '#4bd5ff',
    colorB: '#ff7cd8',
    colorC: '#7cf08b',
    colorful: true,
    colorUpdateSpeed: 8,
    colorCycleSpeed: 0.7,
    bgA: '#030611',
    bgB: '#0b0414',
    brightness: 1.05,
    contrast: 1.16,
    saturation: 1.2,
  },
};

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

  const [
    {
      preset,
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
    },
    setControls,
  ] = useControls(
    'Fluid',
    () => ({
      preset: {
        value: 'default',
        options: {
          Default: 'default',
          'Pavel-Like': 'pavelLike',
          Mobile: 'mobile',
        },
      },
      Solver: folder(
        {
          paused: FLUID_PRESETS.default.paused,
          simResolution: {
            value: FLUID_PRESETS.default.simResolution,
            min: 0.2,
            max: 1,
            step: 0.05,
          },
          pressureRelax: {
            value: FLUID_PRESETS.default.pressureRelax,
            min: 0.2,
            max: 1,
            step: 0.01,
          },
          pressureIterations: {
            value: FLUID_PRESETS.default.pressureIterations,
            min: 8,
            max: 40,
            step: 1,
          },
          vorticity: {
            value: FLUID_PRESETS.default.vorticity,
            min: 0,
            max: 90,
            step: 1,
          },
          velocityDissipation: {
            value: FLUID_PRESETS.default.velocityDissipation,
            min: 0,
            max: 2,
            step: 0.01,
          },
          densityDissipation: {
            value: FLUID_PRESETS.default.densityDissipation,
            min: 0,
            max: 2,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
      Interaction: folder(
        {
          splatRadius: {
            value: FLUID_PRESETS.default.splatRadius,
            min: 0.0005,
            max: 0.02,
            step: 0.0001,
          },
          splatForce: {
            value: FLUID_PRESETS.default.splatForce,
            min: 100,
            max: 12000,
            step: 50,
          },
          dyeStrength: {
            value: FLUID_PRESETS.default.dyeStrength,
            min: 0.05,
            max: 2.5,
            step: 0.01,
          },
          autoSplat: FLUID_PRESETS.default.autoSplat,
          autoSplatStrength: {
            value: FLUID_PRESETS.default.autoSplatStrength,
            min: 0,
            max: 0.6,
            step: 0.01,
          },
          randomBurst: button(() => {
            randomSplatQueueRef.current += 12;
          }),
        },
        { collapsed: true }
      ),
      Effects: folder(
        {
          shading: FLUID_PRESETS.default.shading,
          bloom: FLUID_PRESETS.default.bloom,
          bloomResolution: {
            value: FLUID_PRESETS.default.bloomResolution,
            min: 0.1,
            max: 0.5,
            step: 0.01,
          },
          bloomIterations: {
            value: FLUID_PRESETS.default.bloomIterations,
            min: 1,
            max: 16,
            step: 1,
          },
          bloomIntensity: {
            value: FLUID_PRESETS.default.bloomIntensity,
            min: 0,
            max: 2,
            step: 0.01,
          },
          bloomThreshold: {
            value: FLUID_PRESETS.default.bloomThreshold,
            min: 0,
            max: 1,
            step: 0.01,
          },
          bloomSoftKnee: {
            value: FLUID_PRESETS.default.bloomSoftKnee,
            min: 0,
            max: 1,
            step: 0.01,
          },
          sunrays: FLUID_PRESETS.default.sunrays,
          sunraysResolution: {
            value: FLUID_PRESETS.default.sunraysResolution,
            min: 0.08,
            max: 0.4,
            step: 0.01,
          },
          sunraysWeight: {
            value: FLUID_PRESETS.default.sunraysWeight,
            min: 0.3,
            max: 1.5,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
      Color: folder(
        {
          colorA: FLUID_PRESETS.default.colorA,
          colorB: FLUID_PRESETS.default.colorB,
          colorC: FLUID_PRESETS.default.colorC,
          colorful: FLUID_PRESETS.default.colorful,
          colorUpdateSpeed: {
            value: FLUID_PRESETS.default.colorUpdateSpeed,
            min: 0,
            max: 20,
            step: 0.1,
          },
          colorCycleSpeed: {
            value: FLUID_PRESETS.default.colorCycleSpeed,
            min: 0,
            max: 3,
            step: 0.05,
          },
        },
        { collapsed: true }
      ),
      Display: folder(
        {
          bgA: FLUID_PRESETS.default.bgA,
          bgB: FLUID_PRESETS.default.bgB,
          brightness: {
            value: FLUID_PRESETS.default.brightness,
            min: 0.5,
            max: 2,
            step: 0.01,
          },
          contrast: {
            value: FLUID_PRESETS.default.contrast,
            min: 0.6,
            max: 2,
            step: 0.01,
          },
          saturation: {
            value: FLUID_PRESETS.default.saturation,
            min: 0.2,
            max: 2.2,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
    }),
    { collapsed: true }
  );

  useEffect(() => {
    if (presetRef.current === preset) return;
    const nextPreset = FLUID_PRESETS[preset];
    if (nextPreset) setControls(nextPreset);
    presetRef.current = preset;
  }, [preset, setControls]);

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

  const screenTexel = useMemo(
    () => new THREE.Vector2(1 / size.width, 1 / size.height),
    [size.height, size.width]
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

  const bloomA = useMemo(
    () => new THREE.WebGLRenderTarget(bloomWidth, bloomHeight, rtOptions),
    [bloomHeight, bloomWidth, rtOptions]
  );
  const bloomB = useMemo(
    () => new THREE.WebGLRenderTarget(bloomWidth, bloomHeight, rtOptions),
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
    [simHeight, simWidth, splatRadius]
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
          uDyeTexel: { value: simTexel.clone() },
          uBgA: { value: new THREE.Color(bgA) },
          uBgB: { value: new THREE.Color(bgB) },
          uBrightness: { value: brightness },
          uContrast: { value: contrast },
          uSaturation: { value: saturation },
          uShading: { value: shading },
          uBloomEnabled: { value: bloom },
          uSunraysEnabled: { value: sunrays },
        },
        depthTest: false,
        depthWrite: false,
      }),
    [simTexel]
  );

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
    clearTarget(bloomA);
    clearTarget(bloomB);
    clearTarget(sunraysMask);
    clearTarget(sunraysTex);
    clearTarget(sunraysTemp);

    gl.setRenderTarget(null);

    return () => {
      simMesh.geometry.dispose();

      velocity.read.dispose();
      velocity.write.dispose();
      dye.read.dispose();
      dye.write.dispose();
      pressureTex.read.dispose();
      pressureTex.write.dispose();
      curl.dispose();
      divergence.dispose();
      bloomA.dispose();
      bloomB.dispose();
      sunraysMask.dispose();
      sunraysTex.dispose();
      sunraysTemp.dispose();

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
      sunraysMaskMat.dispose();
      sunraysMat.dispose();
      blurMat.dispose();
      displayMat.dispose();
    };
  }, [
    advectionMat,
    bloomA,
    bloomB,
    bloomBlurMat,
    bloomFinalMat,
    bloomPrefilterMat,
    blurMat,
    clearMat,
    curl,
    curlMat,
    divergence,
    divergenceMat,
    dye.read,
    dye.write,
    displayMat,
    gl,
    gradientMat,
    pressureMat,
    pressureTex.read,
    pressureTex.write,
    simMesh.geometry,
    splatMat,
    sunraysMask,
    sunraysMaskMat,
    sunraysMat,
    sunraysTemp,
    sunraysTex,
    velocity.read,
    velocity.write,
    vorticityMat,
  ]);

  useImperativeHandle(ref, () => ({
    setPointer(next) {
      pointerRef.current = next;
    },
  }));

  useFrame((state) => {
    const dt = Math.min(0.033, state.clock.getDelta());
    const t = state.clock.elapsedTime;

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

    displayMat.uniforms.uDyeTexel.value.copy(screenTexel);
    displayMat.uniforms.uBgA.value.set(bgA);
    displayMat.uniforms.uBgB.value.set(bgB);
    displayMat.uniforms.uBrightness.value = brightness;
    displayMat.uniforms.uContrast.value = contrast;
    displayMat.uniforms.uSaturation.value = saturation;
    displayMat.uniforms.uShading.value = shading;
    displayMat.uniforms.uBloomEnabled.value = bloom;
    displayMat.uniforms.uSunraysEnabled.value = sunrays;

    if (!paused) {
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

      const splatAt = (px, py, vx, vy, rgb, strength = 1) => {
        splatMat.uniforms.uPoint.value.set(px, py);

        splatMat.uniforms.uTarget.value = velocity.read.texture;
        forceRef.current.set(vx, vy, 0);
        splatMat.uniforms.uColor.value.copy(forceRef.current);
        renderPass(splatMat, velocity.write);
        velocity.swap();

        splatMat.uniforms.uTarget.value = dye.read.texture;
        forceRef.current
          .set(rgb.r, rgb.g, rgb.b)
          .multiplyScalar(dyeStrength * strength);
        splatMat.uniforms.uColor.value.copy(forceRef.current);
        renderPass(splatMat, dye.write);
        dye.swap();
      };

      const pointer = pointerRef.current;

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
        const px = 0.5 + Math.sin(t * 0.43) * 0.22;
        const py = 0.5 + Math.cos(t * 0.57) * 0.18;
        const pvx = Math.cos(t * 1.6) * autoSplatStrength * 3.5;
        const pvy = Math.sin(t * 1.4) * autoSplatStrength * 3.5;

        const pulse =
          0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * colorCycleSpeed * 0.8));
        forceRef.current.set(
          colorBRef.current.r,
          colorCRef.current.g,
          colorARef.current.b
        );
        splatAt(px, py, pvx, pvy, forceRef.current, autoSplatStrength * pulse);
      }

      if (randomSplatQueueRef.current > 0) {
        const batch = Math.min(randomSplatQueueRef.current, 6);
        randomSplatQueueRef.current -= batch;
        for (let i = 0; i < batch; i++) {
          const px = Math.random();
          const py = Math.random();
          const vx = (Math.random() * 2 - 1) * splatForce * 0.35;
          const vy = (Math.random() * 2 - 1) * splatForce * 0.35;
          const hueMix = Math.random();
          const tint = colorARef.current
            .clone()
            .lerp(colorBRef.current, hueMix)
            .lerp(colorCRef.current, Math.random() * 0.5);
          splatAt(px, py, vx, vy, tint, 0.5 + Math.random() * 0.8);
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

    if (bloom) {
      const knee = bloomThreshold * bloomSoftKnee + 0.0001;
      bloomPrefilterMat.uniforms.uCurve.value.set(
        bloomThreshold - knee,
        knee * 2,
        0.25 / knee
      );
      bloomPrefilterMat.uniforms.uTexture.value = dye.read.texture;
      renderPass(bloomPrefilterMat, bloomA);

      let sourceTarget = bloomA;
      let destTarget = bloomB;
      const iterations = Math.max(1, Math.floor(bloomIterations));

      for (let i = 0; i < iterations; i++) {
        bloomBlurMat.uniforms.uTexture.value = sourceTarget.texture;
        renderPass(bloomBlurMat, destTarget);

        const temp = sourceTarget;
        sourceTarget = destTarget;
        destTarget = temp;
      }

      bloomFinalMat.uniforms.uTexture.value = sourceTarget.texture;
      renderPass(bloomFinalMat, bloomB);
      displayMat.uniforms.uBloom.value = bloomB.texture;
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
