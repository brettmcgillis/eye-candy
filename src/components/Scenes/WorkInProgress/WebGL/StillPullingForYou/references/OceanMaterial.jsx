import * as THREE from 'three';

import React, { useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

// ---------- GLSL snippets ----------

const WAVE_PREAMBLE = /* glsl */ `
  uniform float uTime;
  uniform float uWaveHeight;
  uniform float uWaveChoppiness;
  uniform float uWaveSpeed;

  // 4 Gerstner wave layers (direction.xy, frequency, amplitude)
  const int WAVE_COUNT = 4;
  vec4 waves[4];

  void initWaves() {
    waves[0] = vec4( 0.6,  0.8, 1.2, 1.0);   // long rolling swell
    waves[1] = vec4(-0.4,  0.9, 2.5, 0.4);   // cross-wind chop
    waves[2] = vec4( 0.9, -0.3, 3.8, 0.2);   // short ripple
    waves[3] = vec4(-0.7, -0.6, 5.0, 0.1);   // micro detail
  }

  // Returns vec3: (displacementX, height, displacementZ)
  vec3 gerstnerWave(vec3 pos) {
    vec3 result = vec3(0.0);
    for (int i = 0; i < WAVE_COUNT; i++) {
      vec2 dir  = normalize(waves[i].xy);
      float freq = waves[i].z;
      float amp  = waves[i].w * uWaveHeight;
      float Q    = uWaveChoppiness / (freq * amp * float(WAVE_COUNT));

      float phase = uWaveSpeed * freq;
      float theta = dot(dir, pos.xz) * freq + uTime * phase;
      float s = sin(theta);
      float c = cos(theta);

      result.x -= Q * amp * dir.x * s;
      result.z -= Q * amp * dir.y * s;
      result.y += amp * c;
    }
    return result;
  }

  // Compute normal from Gerstner wave partial derivatives
  vec3 gerstnerNormal(vec3 pos) {
    vec3 n = vec3(0.0, 1.0, 0.0);
    for (int i = 0; i < WAVE_COUNT; i++) {
      vec2 dir  = normalize(waves[i].xy);
      float freq = waves[i].z;
      float amp  = waves[i].w * uWaveHeight;
      float Q    = uWaveChoppiness / (freq * amp * float(WAVE_COUNT));

      float phase = uWaveSpeed * freq;
      float theta = dot(dir, pos.xz) * freq + uTime * phase;
      float s = sin(theta);
      float c = cos(theta);
      float WA = freq * amp;

      n.x -= dir.x * WA * s;
      n.z -= dir.y * WA * s;
      n.y -= Q * WA * c;
    }
    return normalize(n);
  }
`;

const VERTEX_COMMON_REPLACE = /* glsl */ `
  #include <common>
  ${WAVE_PREAMBLE}
`;

const BEGINNORMAL_REPLACE = /* glsl */ `
  initWaves();
  vec3 gNorm = gerstnerNormal(position);
  vec3 objectNormal = gNorm;
  #ifdef USE_TANGENT
    vec3 objectTangent = vec3(tangent.xyz);
  #endif
`;

const BEGIN_VERTEX_REPLACE = /* glsl */ `
  initWaves();
  vec3 waveDisp = gerstnerWave(position);
  vec3 transformed = position + waveDisp;
  #ifdef USE_ALPHAHASH
    vPosition = vec3(position);
  #endif
`;

// ---------- React wrapper ----------

const uniforms = {
  uTime: { value: 0 },
  uWaveHeight: { value: 0.15 },
  uWaveChoppiness: { value: 0.7 },
  uWaveSpeed: { value: 0.8 },
};

export default function OceanMaterial({ config }) {
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.waterColor),
      metalness: config.waterMetalness,
      roughness: config.waterRoughness,
      transparent: true,
      opacity: config.waterOpacity,
      side: THREE.FrontSide,
      envMapIntensity: 1.2,
    });

    // eslint-disable-next-line no-param-reassign
    mat.onBeforeCompile = (s) => {
      const sh = s;
      Object.entries(uniforms).forEach(([key, u]) => {
        sh.uniforms[key] = u;
      });

      sh.vertexShader = sh.vertexShader.replace(
        '#include <common>',
        VERTEX_COMMON_REPLACE
      );
      sh.vertexShader = sh.vertexShader.replace(
        '#include <beginnormal_vertex>',
        BEGINNORMAL_REPLACE
      );
      sh.vertexShader = sh.vertexShader.replace(
        '#include <begin_vertex>',
        BEGIN_VERTEX_REPLACE
      );
    };

    return mat;
  }, [
    config.waterColor,
    config.waterMetalness,
    config.waterRoughness,
    config.waterOpacity,
  ]);

  // Drive time uniform each frame
  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    uniforms.uWaveHeight.value = config.waveHeight;
    uniforms.uWaveChoppiness.value = config.waveChoppiness;
    uniforms.uWaveSpeed.value = config.waveSpeed;
  });

  return <primitive object={material} attach="material" />;
}

// Helper: sample wave height at a world xz position (CPU side, matches GPU)
const RAW_WAVES = [
  { dx: 0.6, dz: 0.8, freq: 1.2, amp: 1.0 },
  { dx: -0.4, dz: 0.9, freq: 2.5, amp: 0.4 },
  { dx: 0.9, dz: -0.3, freq: 3.8, amp: 0.2 },
  { dx: -0.7, dz: -0.6, freq: 5.0, amp: 0.1 },
];

// Normalise directions once
const WAVES = RAW_WAVES.map((w) => {
  const len = Math.sqrt(w.dx * w.dx + w.dz * w.dz);
  return { dx: w.dx / len, dz: w.dz / len, freq: w.freq, amp: w.amp };
});

export function sampleWaveHeight(x, z, waveHeight, waveChoppiness, waveSpeed) {
  const t = uniforms.uTime.value;
  let y = 0;
  for (let i = 0; i < WAVES.length; i += 1) {
    const { dx, dz, freq, amp: baseAmp } = WAVES[i];
    const amp = baseAmp * waveHeight;
    const phase = waveSpeed * freq;
    const theta = (dx * x + dz * z) * freq + t * phase;
    y += amp * Math.cos(theta);
  }
  return y;
}

export function sampleWaveNormal(x, z, waveHeight, waveChoppiness, waveSpeed) {
  const t = uniforms.uTime.value;
  let nx = 0;
  let ny = 1;
  let nz = 0;
  for (let i = 0; i < WAVES.length; i += 1) {
    const { dx, dz, freq, amp: baseAmp } = WAVES[i];
    const amp = baseAmp * waveHeight;
    const Q = waveChoppiness / (freq * amp * WAVES.length);
    const phase = waveSpeed * freq;
    const theta = (dx * x + dz * z) * freq + t * phase;
    const s = Math.sin(theta);
    const c = Math.cos(theta);
    const WA = freq * amp;
    nx -= dx * WA * s;
    nz -= dz * WA * s;
    ny -= Q * WA * c;
  }
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  return { x: nx / len, y: ny / len, z: nz / len };
}
