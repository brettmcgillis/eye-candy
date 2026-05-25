/* eslint-disable no-continue */

/* eslint-disable react/no-array-index-key */

/* eslint-disable no-param-reassign */

/* eslint-disable no-underscore-dangle */
import * as THREE from 'three';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  DEFAULT_FIRE_AND_SMOKE_CONFIG,
  DEFAULT_FIRE_AND_SMOKE_CONTROL_POINTS,
} from './fireAndSmokeDefaults';

const STATE_BEFORE_START = 0;
const STATE_SPAWN = 1;
const STATE_SPAWN_DOWN = 2;
const STATE_FLOATING = 3;
const STATE_IDLE = 4;

const BEFORE_INTERVAL = 300;
const SPAWN_INTERVAL = 400;
const SPAWN_DOWN_INTERVAL = 2000;
const FLOATING_INTERVAL = 8000;
const IDLE_INTERVAL = 20000;
const MAXIMUM_PARTICLE_LIVE_TIME = 20000;
const TOTAL_FLAME_LIFETIME_MS =
  BEFORE_INTERVAL +
  SPAWN_INTERVAL +
  SPAWN_DOWN_INTERVAL +
  FLOATING_INTERVAL +
  IDLE_INTERVAL;
const FLAME_TRAVEL_DURATION_MS = TOTAL_FLAME_LIFETIME_MS;
const PARTICLE_TRAVEL_DURATION_MS = MAXIMUM_PARTICLE_LIVE_TIME;
const FRAME_MS = 1000 / 60;
const FRAME_SEGMENTS = 256;
const MAX_SIM_DELTA_SECONDS = 0.05;
const DEFAULT_ATTRACTOR_STRENGTH = 3;
const DEFAULT_ATTRACTOR_RADIUS = 3;
const FLAME_ATTRACTOR_RETURN_STRENGTH = 7;
const FLAME_ATTRACTOR_DAMPING = 0.08;
const FLAME_ATTRACTOR_MAX_OFFSET_FACTOR = 0.35;
const FLAME_ATTRACTOR_DIRECTION_SCALE = 0.25;
const PARTICLE_ATTRACTOR_RETURN_STRENGTH = 4.5;
const PARTICLE_ATTRACTOR_DAMPING = 0.12;
const PARTICLE_ATTRACTOR_MAX_OFFSET_FACTOR = 0.5;
const PARTICLE_ATTRACTOR_DIRECTION_SCALE = 0.4;

const flameVertexShader = /* glsl */ `
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec3 fade(vec3 t) {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float pnoise(vec3 P, vec3 rep) {
  vec3 Pi0 = mod(floor(P), rep);
  vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;
  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);
  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);
  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);
  vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
  vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
  vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
  vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
  vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
  vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
  vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
  vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);
  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;
  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);
  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  return 2.2 * mix(n_yz.x, n_yz.y, fade_xyz.x);
}

float turbulence(vec3 p) {
  float t = -0.5;
  for (float f = 1.0; f <= 10.0; f++) {
    float power = pow(2.0, f);
    t += abs(pnoise(p * power, vec3(10.0, 10.0, 10.0)) / power);
  }
  return t;
}

varying float noise;
uniform float time;
uniform float seed;
uniform float detail;
uniform float baseRadius;

#include <fog_pars_vertex>

void main() {
  vec3 basePosition = position * baseRadius;
  noise = detail * -0.10 * turbulence(0.6 * normal + time + seed);
  float billow = 2.0 * pnoise(0.05 * basePosition + vec3(2.0 * time), vec3(100.0));
  float displacement = -10.0 * noise + billow;
  vec3 newPosition = basePosition + normal * displacement;
  vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const flameFragmentShader = /* glsl */ `
varying float noise;
uniform vec3 colLight;
uniform vec3 colNormal;
uniform vec3 colDark;
uniform float opacity;

#include <fog_pars_fragment>

vec3 blend(vec3 a, vec3 b, float t) {
  return vec3(
    a.r + (b.r - a.r) * t,
    a.g + (b.g - a.g) * t,
    a.b + (b.b - a.b) * t
  );
}

void main() {
  vec3 col;
  float range = noise;

  if (range > 0.6) {
    col = colDark;
  } else if (range > 0.4) {
    col = blend(colNormal, colDark, (range - 0.4) / 0.2);
  } else {
    col = blend(colLight, colNormal, range / 0.4);
  }

  gl_FragColor = vec4(col, opacity);
  #include <fog_fragment>
}
`;

const particleVertexShader = /* glsl */ `
attribute float size;
attribute vec3 customColor;
varying vec3 vColor;
uniform float pointScale;

#include <fog_pars_vertex>

void main() {
  vColor = customColor;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  float cameraDist = max(0.0001, length(mvPosition.xyz - position.xyz));
  gl_PointSize = size * pointScale / cameraDist;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const particleFragmentShader = /* glsl */ `
uniform sampler2D map;
varying vec3 vColor;

#include <fog_pars_fragment>

void main() {
  vec4 texel = texture2D(map, gl_PointCoord);
  if (texel.a < 0.01) discard;
  gl_FragColor = vec4(vColor, 1.0) * texel;
  #include <fog_fragment>
}
`;

const _curvePos = new THREE.Vector3();
const _curveTan = new THREE.Vector3();
const _curveNormalA = new THREE.Vector3();
const _curveNormalB = new THREE.Vector3();
const _curveBinormalA = new THREE.Vector3();
const _curveBinormalB = new THREE.Vector3();
const _sampleScale = new THREE.Vector3();
const _sampleNormal = new THREE.Vector3();
const _sampleBinormal = new THREE.Vector3();
const _localOffset = new THREE.Vector3();
const _localPosition = new THREE.Vector3();
const _identityScale = new THREE.Vector3(1, 1, 1);
const _rootWorldQuaternion = new THREE.Quaternion();
const _inverseRootWorldQuaternion = new THREE.Quaternion();
const _interactionPosition = new THREE.Vector3();
const _particleBasePosition = new THREE.Vector3();
const _particleInteractionOffset = new THREE.Vector3();
const _particleInteractionVelocity = new THREE.Vector3();
const _attractorDelta = new THREE.Vector3();

function isFiniteVec3Tuple(value) {
  return (
    Array.isArray(value) &&
    value.length >= 3 &&
    value.every((entry) => Number.isFinite(entry))
  );
}

function clearArrayVec3(array, offset) {
  array[offset] = 0;
  array[offset + 1] = 0;
  array[offset + 2] = 0;
}

function wrapCurveT(t, closed) {
  if (closed) {
    return ((t % 1) + 1) % 1;
  }

  return THREE.MathUtils.clamp(t, 0, 1);
}

function lerpScale(controlPoints, t, closed, out) {
  const count = controlPoints.length;
  if (!count) {
    out.copy(_identityScale);
    return out;
  }

  if (count === 1) {
    out.copy(controlPoints[0].scale ?? _identityScale);
    return out;
  }

  const safeT = wrapCurveT(t, closed);
  const span = closed ? count : count - 1;
  const seg = Math.min(safeT * span, span - 1e-6);
  const index = Math.floor(seg);
  const weight = seg - index;
  const start = controlPoints[index % count].scale ?? _identityScale;
  const end = controlPoints[(index + 1) % count].scale ?? _identityScale;

  out.copy(start).lerp(end, weight);
  return out;
}

function sampleCurveFrame(curveData, controlPoints, t, out) {
  const safeT = wrapCurveT(t, curveData.closed);
  const { curve, frames } = curveData;
  const scaledIndex = safeT * FRAME_SEGMENTS;
  const index = Math.floor(scaledIndex);
  const nextIndex = Math.min(index + 1, FRAME_SEGMENTS);
  const weight = scaledIndex - index;

  curve.getPointAt(safeT, out.position);
  curve.getTangentAt(safeT, out.tangent).normalize();
  _curveNormalA.copy(frames.normals[index]);
  _curveNormalB.copy(frames.normals[nextIndex]);
  _curveBinormalA.copy(frames.binormals[index]);
  _curveBinormalB.copy(frames.binormals[nextIndex]);

  out.normal.copy(_curveNormalA).lerp(_curveNormalB, weight).normalize();
  out.binormal.copy(_curveBinormalA).lerp(_curveBinormalB, weight).normalize();
  lerpScale(controlPoints, safeT, curveData.closed, out.scale);
}

function createParticleTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');

  if (!context) {
    return new THREE.Texture();
  }

  const gradient = context.createRadialGradient(
    size * 0.5,
    size * 0.5,
    0,
    size * 0.5,
    size * 0.5,
    size * 0.48
  );
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.75)');
  gradient.addColorStop(0.7, 'rgba(255,255,255,0.22)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');

  context.clearRect(0, 0, size, size);
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;

  return texture;
}

function createFlameMaterial(seed, detail = 1) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      time: { value: 0 },
      seed: { value: seed },
      detail: { value: detail },
      baseRadius: { value: 10.5 },
      opacity: { value: 1 },
      colLight: { value: new THREE.Color('#ffffff') },
      colNormal: { value: new THREE.Color('#ffffff') },
      colDark: { value: new THREE.Color('#000000') },
    },
    vertexShader: flameVertexShader,
    fragmentShader: flameFragmentShader,
    transparent: true,
    depthWrite: false,
    fog: true,
    toneMapped: false,
  });
}

function buildFlamePool(poolSize) {
  return Array.from({ length: poolSize }, () => ({
    material: createFlameMaterial(Math.random() * 1000),
    radius: 0,
    baseRadius: 10.5,
    currentTime: 0,
    timeCount: 0,
    state: STATE_BEFORE_START,
    isActive: false,
    flowRatio: 1,
    opacity: 1,
    currentScale: 0,
    offsetX: 0,
    offsetY: 0,
    offsetZ: 0,
    distX: 0,
    distZ: 0,
    yRatio: 0,
    animationTimeRatio: 0,
    randFlyX: 0,
    randFlyZ: 0,
    colorTransitionRandom: 0,
    detailRatio: Math.random(),
    pathStartT: 0,
    idleStartY: 0,
    interactionOffset: new THREE.Vector3(),
    interactionVelocity: new THREE.Vector3(),
  }));
}

function initializeParticleSlot(state, index) {
  const offset = index * 3;
  state.positions[offset] = 0;
  state.positions[offset + 1] = 0;
  state.positions[offset + 2] = 0;
  state.sizes[index] = 0;
  state.sizeRatios[index] = Math.random();
  state.moveDest[offset] = Math.random() * 200 - 100;
  state.moveDest[offset + 1] = Math.random() * 0.3 + 0.45;
  state.moveDest[offset + 2] = Math.random() * 200 - 100;
  state.particleTime[index] = 0;
  state.active[index] = false;
  state.startT[index] = 0;
  clearArrayVec3(state.interactionOffsets, offset);
  clearArrayVec3(state.interactionVelocities, offset);
}

function createParticleState(particleCount) {
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const sizeRatios = new Float32Array(particleCount);
  const moveDest = new Float32Array(particleCount * 3);
  const particleTime = new Float32Array(particleCount);
  const active = new Array(particleCount).fill(false);
  const startT = new Float32Array(particleCount);
  const interactionOffsets = new Float32Array(particleCount * 3);
  const interactionVelocities = new Float32Array(particleCount * 3);

  const state = {
    positions,
    colors,
    sizes,
    sizeRatios,
    moveDest,
    particleTime,
    active,
    startT,
    interactionOffsets,
    interactionVelocities,
    elapsed: 0,
    spawnElapsed: 0,
    spawnInterval: 1,
    targetCount: particleCount,
  };

  for (let index = 0; index < particleCount; index += 1) {
    initializeParticleSlot(state, index);
  }

  return state;
}

function resizeParticleState(state, particleCount) {
  if (!state) {
    return createParticleState(particleCount);
  }

  state.targetCount = particleCount;
  const currentCount = state.active.length;
  if (currentCount >= particleCount) {
    return state;
  }

  const nextState = {
    positions: new Float32Array(particleCount * 3),
    colors: new Float32Array(particleCount * 3),
    sizes: new Float32Array(particleCount),
    sizeRatios: new Float32Array(particleCount),
    moveDest: new Float32Array(particleCount * 3),
    particleTime: new Float32Array(particleCount),
    active: [
      ...state.active,
      ...Array(particleCount - currentCount).fill(false),
    ],
    startT: new Float32Array(particleCount),
    interactionOffsets: new Float32Array(particleCount * 3),
    interactionVelocities: new Float32Array(particleCount * 3),
    elapsed: state.elapsed,
    spawnElapsed: state.spawnElapsed,
    spawnInterval: state.spawnInterval,
    targetCount: particleCount,
  };

  nextState.positions.set(state.positions);
  nextState.colors.set(state.colors);
  nextState.sizes.set(state.sizes);
  nextState.sizeRatios.set(state.sizeRatios);
  nextState.moveDest.set(state.moveDest);
  nextState.particleTime.set(state.particleTime);
  nextState.startT.set(state.startT);
  nextState.interactionOffsets.set(state.interactionOffsets);
  nextState.interactionVelocities.set(state.interactionVelocities);

  for (let index = currentCount; index < particleCount; index += 1) {
    initializeParticleSlot(nextState, index);
  }

  return nextState;
}

function applyTransitionColor(target, startColor, endColor, t) {
  target.copy(startColor).lerp(endColor, t);
}

function updateFlamePalette(flame, palette) {
  const timeCount = flame.timeCount + flame.colorTransitionRandom;
  const { uniforms } = flame.material;

  if (timeCount < 2500) {
    uniforms.colDark.value.copy(palette.normalColor);
    uniforms.colNormal.value.copy(palette.lightColor);
    uniforms.colLight.value.copy(palette.lightColor2);
    return;
  }

  if (timeCount < 4000) {
    applyTransitionColor(
      uniforms.colDark.value,
      palette.normalColor,
      palette.darkColor2,
      (timeCount - 2500) / 1500
    );
    applyTransitionColor(
      uniforms.colNormal.value,
      palette.lightColor,
      palette.normalColor,
      (timeCount - 2500) / 1500
    );
    applyTransitionColor(
      uniforms.colLight.value,
      palette.lightColor2,
      palette.lightColor,
      (timeCount - 2500) / 1500
    );
    return;
  }

  if (timeCount < 7000) {
    uniforms.colDark.value.copy(palette.darkColor2);
    uniforms.colNormal.value.copy(palette.normalColor);
    uniforms.colLight.value.copy(palette.lightColor);
    return;
  }

  if (timeCount < 12000) {
    const blend = (timeCount - 7000) / 5000;
    applyTransitionColor(
      uniforms.colDark.value,
      palette.darkColor2,
      palette.darkColor,
      blend
    );
    applyTransitionColor(
      uniforms.colNormal.value,
      palette.normalColor,
      palette.darkColor2,
      blend
    );
    applyTransitionColor(
      uniforms.colLight.value,
      palette.lightColor,
      palette.normalColor,
      blend
    );
    return;
  }

  if (timeCount < 17000) {
    const blend = (timeCount - 12000) / 5000;
    applyTransitionColor(
      uniforms.colDark.value,
      palette.darkColor,
      palette.darkColor,
      blend
    );
    applyTransitionColor(
      uniforms.colNormal.value,
      palette.darkColor2,
      palette.darkColor,
      blend
    );
    applyTransitionColor(
      uniforms.colLight.value,
      palette.normalColor,
      palette.darkColor2,
      blend
    );
    return;
  }

  const blend = THREE.MathUtils.clamp((timeCount - 17000) / 6000, 0, 1);
  applyTransitionColor(
    uniforms.colDark.value,
    palette.darkColor,
    palette.greyColor,
    blend
  );
  applyTransitionColor(
    uniforms.colNormal.value,
    palette.darkColor,
    palette.greyColor,
    blend
  );
  applyTransitionColor(
    uniforms.colLight.value,
    palette.darkColor2,
    palette.darkColor,
    blend
  );
}

function resolveLocalAttractors(
  attractorsRef,
  rootGroup,
  fallbackStrength,
  fallbackRadius,
  out
) {
  out.length = 0;

  const attractors = attractorsRef?.current;
  if (!rootGroup || !attractors?.length) {
    return out;
  }

  rootGroup.updateWorldMatrix(true, false);
  rootGroup.getWorldQuaternion(_rootWorldQuaternion);
  _inverseRootWorldQuaternion.copy(_rootWorldQuaternion).invert();

  let count = 0;
  for (let index = 0; index < attractors.length; index += 1) {
    const attractor = attractors[index];
    if (!isFiniteVec3Tuple(attractor?.position)) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const strength = attractor.strength ?? fallbackStrength;
    const radius = attractor.radius ?? fallbackRadius;
    if (
      !Number.isFinite(strength) ||
      !Number.isFinite(radius) ||
      strength === 0 ||
      radius <= 0
    ) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const resolved = out[count] ?? {
      position: new THREE.Vector3(),
      direction: new THREE.Vector3(),
      radius: fallbackRadius,
      strength: fallbackStrength,
      sign: 1,
    };

    resolved.position.set(
      attractor.position[0],
      attractor.position[1],
      attractor.position[2]
    );
    rootGroup.worldToLocal(resolved.position);

    if (isFiniteVec3Tuple(attractor.direction)) {
      resolved.direction
        .set(
          attractor.direction[0],
          attractor.direction[1],
          attractor.direction[2]
        )
        .applyQuaternion(_inverseRootWorldQuaternion);

      if (resolved.direction.lengthSq() > 1e-6) {
        resolved.direction.normalize();
      } else {
        resolved.direction.set(0, 0, 0);
      }
    } else {
      resolved.direction.set(0, 0, 0);
    }

    resolved.radius = radius;
    resolved.strength = strength;
    resolved.sign = attractor.type === 'repeller' ? -1 : 1;

    out[count] = resolved;
    count += 1;
  }

  out.length = count;
  return out;
}

function integrateAttractorOffset(
  basePosition,
  offset,
  velocity,
  attractors,
  dt,
  returnStrength,
  damping,
  maxOffset,
  directionalScale
) {
  if (dt <= 0) {
    return;
  }

  velocity.addScaledVector(offset, -returnStrength * dt);
  _interactionPosition.copy(basePosition).add(offset);

  for (let index = 0; index < attractors.length; index += 1) {
    const attractor = attractors[index];
    _attractorDelta.subVectors(attractor.position, _interactionPosition);

    const distSq = Math.max(_attractorDelta.lengthSq(), 0.0001);
    const dist = Math.sqrt(distSq);
    const falloff = attractor.radius * attractor.radius;
    const radialForce = (attractor.strength * falloff) / (distSq + falloff);
    const radialStrength = attractor.sign * radialForce;

    velocity.addScaledVector(_attractorDelta, (radialStrength * dt) / dist);

    if (attractor.direction.lengthSq() > 0) {
      const directionalStrength =
        attractor.sign *
        ((attractor.strength * directionalScale * falloff) /
          (distSq + falloff));
      velocity.addScaledVector(attractor.direction, directionalStrength * dt);
    }
  }

  velocity.multiplyScalar(damping ** dt);
  offset.addScaledVector(velocity, dt);

  if (maxOffset > 0 && offset.lengthSq() > maxOffset * maxOffset) {
    offset.setLength(maxOffset);
    velocity.multiplyScalar(0.5);
  }
}

export default function FireAndSmokeGL({
  controlPoints = DEFAULT_FIRE_AND_SMOKE_CONTROL_POINTS,
  closed = DEFAULT_FIRE_AND_SMOKE_CONFIG.closed,
  timeScale = DEFAULT_FIRE_AND_SMOKE_CONFIG.timeScale,
  spawnIntervalMs = DEFAULT_FIRE_AND_SMOKE_CONFIG.spawnIntervalMs,
  pathTravel = DEFAULT_FIRE_AND_SMOKE_CONFIG.pathTravel,
  worldScale = DEFAULT_FIRE_AND_SMOKE_CONFIG.worldScale,
  poolSize = DEFAULT_FIRE_AND_SMOKE_CONFIG.poolSize,
  particleCount = DEFAULT_FIRE_AND_SMOKE_CONFIG.particleCount,
  particleSpread = DEFAULT_FIRE_AND_SMOKE_CONFIG.particleSpread,
  particleColor = DEFAULT_FIRE_AND_SMOKE_CONFIG.particleColor,
  particleSize = DEFAULT_FIRE_AND_SMOKE_CONFIG.particleSize,
  particleSizeMin = DEFAULT_FIRE_AND_SMOKE_CONFIG.particleSizeMin,
  particleSizeMax = DEFAULT_FIRE_AND_SMOKE_CONFIG.particleSizeMax,
  particlePointScale = DEFAULT_FIRE_AND_SMOKE_CONFIG.particlePointScale,
  radiusMin = DEFAULT_FIRE_AND_SMOKE_CONFIG.radiusMin,
  radiusMax = DEFAULT_FIRE_AND_SMOKE_CONFIG.radiusMax,
  shapeRadiusMin = DEFAULT_FIRE_AND_SMOKE_CONFIG.shapeRadiusMin,
  shapeRadiusMax = DEFAULT_FIRE_AND_SMOKE_CONFIG.shapeRadiusMax,
  detailMin = DEFAULT_FIRE_AND_SMOKE_CONFIG.detailMin,
  detailMax = DEFAULT_FIRE_AND_SMOKE_CONFIG.detailMax,
  driftScale = DEFAULT_FIRE_AND_SMOKE_CONFIG.driftScale,
  riseScale = DEFAULT_FIRE_AND_SMOKE_CONFIG.riseScale,
  showParticles = DEFAULT_FIRE_AND_SMOKE_CONFIG.showParticles,
  lightColor2 = DEFAULT_FIRE_AND_SMOKE_CONFIG.lightColor2,
  lightColor = DEFAULT_FIRE_AND_SMOKE_CONFIG.lightColor,
  normalColor = DEFAULT_FIRE_AND_SMOKE_CONFIG.normalColor,
  darkColor2 = DEFAULT_FIRE_AND_SMOKE_CONFIG.darkColor2,
  greyColor = DEFAULT_FIRE_AND_SMOKE_CONFIG.greyColor,
  darkColor = DEFAULT_FIRE_AND_SMOKE_CONFIG.darkColor,
  attractorsRef = null,
  attractorStrength = DEFAULT_ATTRACTOR_STRENGTH,
  attractorRadius = DEFAULT_ATTRACTOR_RADIUS,
}) {
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, 3), []);
  const particleTexture = useMemo(() => createParticleTexture(), []);
  const particleGeometry = useMemo(() => new THREE.BufferGeometry(), []);
  const particleMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
          map: { value: particleTexture },
          pointScale: { value: particlePointScale },
        },
        vertexShader: particleVertexShader,
        fragmentShader: particleFragmentShader,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.NormalBlending,
        fog: true,
        toneMapped: false,
      }),
    [particleTexture]
  );
  const effectivePoolSize = Math.max(
    poolSize,
    Math.ceil(TOTAL_FLAME_LIFETIME_MS / Math.max(1, spawnIntervalMs)) + 1
  );
  const [flamePool, setFlamePool] = useState(() =>
    buildFlamePool(effectivePoolSize)
  );
  const particleStateRef = useRef(null);
  const flamePoolRef = useRef(flamePool);
  const initializedFlameCountRef = useRef(0);

  const flameMeshRefs = useRef([]);
  const particlePointsRef = useRef();
  const flameSpawnElapsedRef = useRef(0);
  const rootGroupRef = useRef();
  const resolvedAttractorsRef = useRef([]);

  const palette = useMemo(
    () => ({
      lightColor2: new THREE.Color(lightColor2),
      lightColor: new THREE.Color(lightColor),
      normalColor: new THREE.Color(normalColor),
      darkColor2: new THREE.Color(darkColor2),
      greyColor: new THREE.Color(greyColor),
      darkColor: new THREE.Color(darkColor),
      particleColor: new THREE.Color(particleColor),
    }),
    [
      lightColor2,
      lightColor,
      normalColor,
      darkColor2,
      greyColor,
      darkColor,
      particleColor,
    ]
  );

  const curveData = useMemo(() => {
    const sourcePoints =
      controlPoints.length > 1
        ? controlPoints.map((point) => point.position.clone())
        : [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0)];
    const curve = new THREE.CatmullRomCurve3(
      sourcePoints,
      closed,
      'centripetal'
    );
    return {
      curve,
      frames: curve.computeFrenetFrames(FRAME_SEGMENTS, closed),
      length: Math.max(curve.getLength(), 0.0001),
      closed,
    };
  }, [controlPoints, closed]);

  useEffect(() => {
    const prevState = particleStateRef.current;
    const particleState = resizeParticleState(prevState, particleCount);
    particleStateRef.current = particleState;

    const needsNewAttributes =
      !particleGeometry.getAttribute('position') || particleState !== prevState;
    if (!needsNewAttributes) {
      return;
    }

    particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(particleState.positions, 3).setUsage(
        THREE.DynamicDrawUsage
      )
    );
    particleGeometry.setAttribute(
      'customColor',
      new THREE.BufferAttribute(particleState.colors, 3).setUsage(
        THREE.DynamicDrawUsage
      )
    );
    particleGeometry.setAttribute(
      'size',
      new THREE.BufferAttribute(particleState.sizes, 1).setUsage(
        THREE.DynamicDrawUsage
      )
    );
    particleGeometry.attributes.position.needsUpdate = true;
    particleGeometry.attributes.customColor.needsUpdate = true;
    particleGeometry.attributes.size.needsUpdate = true;
  }, [particleCount, particleGeometry]);

  useEffect(() => {
    flamePoolRef.current = flamePool;
  }, [flamePool]);

  useEffect(() => {
    if (effectivePoolSize <= flamePool.length) {
      return;
    }

    setFlamePool((prev) => {
      if (prev.length >= effectivePoolSize) {
        return prev;
      }

      return [...prev, ...buildFlamePool(effectivePoolSize - prev.length)];
    });
  }, [effectivePoolSize, flamePool.length]);

  useEffect(() => {
    const particleUniforms = particleMaterial.uniforms;
    particleUniforms.pointScale.value = particlePointScale;
  }, [particleMaterial, particlePointScale]);

  useEffect(
    () => () => {
      geometry.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      particleTexture.dispose();
      flamePoolRef.current.forEach((flame) => flame.material.dispose());
    },
    [geometry, particleGeometry, particleMaterial, particleTexture]
  );

  useEffect(() => {
    // Keep existing flames alive; only initialize newly appended pool entries.
    for (
      let index = initializedFlameCountRef.current;
      index < flamePool.length;
      index += 1
    ) {
      const flame = flamePool[index];
      flame.currentTime = 0;
      flame.timeCount = 0;
      flame.state = STATE_BEFORE_START;
      flame.isActive = false;
      flame.flowRatio = 1;
      flame.opacity = 1;
      flame.currentScale = 0;
      flame.offsetX = 0;
      flame.offsetY = 0;
      flame.offsetZ = 0;
      flame.idleStartY = 0;
      flame.interactionOffset.set(0, 0, 0);
      flame.interactionVelocity.set(0, 0, 0);
      flame.material.uniforms.time.value = 0;
      flame.material.uniforms.detail.value = THREE.MathUtils.lerp(
        detailMin,
        detailMax,
        flame.detailRatio
      );
      flame.material.uniforms.opacity.value = 0;

      const mesh = flameMeshRefs.current[index];
      if (mesh) {
        mesh.visible = false;
        mesh.position.set(0, 0, 0);
        mesh.scale.setScalar(0.0001);
      }
    }

    initializedFlameCountRef.current = flamePool.length;
  }, [detailMax, detailMin, flamePool]);

  useFrame((_, deltaSeconds) => {
    const deltaMs = Math.min(deltaSeconds, MAX_SIM_DELTA_SECONDS) * 1000;
    const scaledDeltaMs = deltaMs * timeScale;
    const scaledDeltaSeconds = scaledDeltaMs / 1000;
    const frameScale = scaledDeltaMs / FRAME_MS;
    const particleState = particleStateRef.current;
    if (!particleState) {
      return;
    }
    const resolvedAttractors = resolveLocalAttractors(
      attractorsRef,
      rootGroupRef.current,
      attractorStrength,
      attractorRadius,
      resolvedAttractorsRef.current
    );

    let maxResolvedAttractorRadius = attractorRadius;
    for (let index = 0; index < resolvedAttractors.length; index += 1) {
      maxResolvedAttractorRadius = Math.max(
        maxResolvedAttractorRadius,
        resolvedAttractors[index].radius
      );
    }

    const flameMaxInteractionOffset = Math.max(
      0.25,
      maxResolvedAttractorRadius * FLAME_ATTRACTOR_MAX_OFFSET_FACTOR
    );
    const particleMaxInteractionOffset = Math.max(
      0.35,
      maxResolvedAttractorRadius * PARTICLE_ATTRACTOR_MAX_OFFSET_FACTOR
    );

    const spawnFlame = () => {
      let flame = null;
      const flameLimit = Math.min(effectivePoolSize, flamePool.length);
      for (let index = 0; index < flameLimit; index += 1) {
        if (!flamePool[index].isActive) {
          flame = flamePool[index];
          break;
        }
      }

      if (!flame) return;

      const radiusRatio = Math.random();

      flame.radius = THREE.MathUtils.lerp(radiusMin, radiusMax, radiusRatio);
      flame.baseRadius = THREE.MathUtils.lerp(
        shapeRadiusMin,
        shapeRadiusMax,
        radiusRatio
      );
      flame.currentTime = 0;
      flame.timeCount = 0;
      flame.state = STATE_BEFORE_START;
      flame.isActive = true;
      flame.flowRatio = 1;
      flame.opacity = 1;
      flame.currentScale = 0.0001;
      flame.offsetX = 0;
      flame.offsetY = 0;
      flame.offsetZ = 0;
      flame.distX = Math.random() * 7 - 4;
      flame.distZ = Math.random() * 7 - 4;
      flame.yRatio = Math.random() * 0.4 + 0.35;
      flame.animationTimeRatio = Math.random() * 0.4 + 0.3;
      flame.randFlyX = Math.random() * 0.1 - 0.05;
      flame.randFlyZ = Math.random() * 0.1 - 0.05;
      flame.colorTransitionRandom = Math.random() * 2000 - 1000;
      flame.detailRatio = Math.random();
      flame.pathStartT = 0;
      flame.idleStartY = 0;
      flame.interactionOffset.set(0, 0, 0);
      flame.interactionVelocity.set(0, 0, 0);
      flame.material.uniforms.baseRadius.value = flame.baseRadius;
      flame.material.uniforms.detail.value = THREE.MathUtils.lerp(
        detailMin,
        detailMax,
        flame.detailRatio
      );
      flame.material.uniforms.opacity.value = 1;
    };

    particleState.spawnElapsed += scaledDeltaMs;
    if (particleState.spawnElapsed > particleState.spawnInterval) {
      particleState.spawnElapsed = 0;
      particleState.spawnInterval = Math.random() * 300 + 50;
      for (let index = 0; index < particleState.targetCount; index += 1) {
        if (!particleState.active[index]) {
          const offset = index * 3;
          particleState.active[index] = true;
          particleState.particleTime[index] = 0;
          particleState.startT[index] = 0;
          clearArrayVec3(particleState.interactionOffsets, offset);
          clearArrayVec3(particleState.interactionVelocities, offset);
          break;
        }
      }
    }

    flameSpawnElapsedRef.current += scaledDeltaMs;
    while (flameSpawnElapsedRef.current >= spawnIntervalMs) {
      flameSpawnElapsedRef.current -= spawnIntervalMs;
      spawnFlame();
    }

    flamePool.forEach((flame, index) => {
      const mesh = flameMeshRefs.current[index];
      if (!mesh || !flame.isActive) {
        if (mesh) mesh.visible = false;
        return;
      }

      flame.currentTime += scaledDeltaMs;
      flame.timeCount += scaledDeltaMs;

      if (
        flame.state === STATE_BEFORE_START &&
        flame.currentTime > BEFORE_INTERVAL
      ) {
        flame.currentTime -= BEFORE_INTERVAL;
        flame.state = STATE_SPAWN;
      } else if (
        flame.state === STATE_SPAWN &&
        flame.currentTime > SPAWN_INTERVAL
      ) {
        flame.currentTime -= SPAWN_INTERVAL;
        flame.state = STATE_SPAWN_DOWN;
      } else if (
        flame.state === STATE_SPAWN_DOWN &&
        flame.currentTime > SPAWN_DOWN_INTERVAL
      ) {
        flame.currentTime -= SPAWN_DOWN_INTERVAL;
        flame.state = STATE_FLOATING;
      } else if (
        flame.state === STATE_FLOATING &&
        flame.currentTime > FLOATING_INTERVAL
      ) {
        flame.currentTime -= FLOATING_INTERVAL;
        flame.state = STATE_IDLE;
        flame.flowRatio = 0.2;
        flame.idleStartY = flame.offsetY;
      } else if (
        flame.state === STATE_IDLE &&
        flame.currentTime > IDLE_INTERVAL
      ) {
        flame.isActive = false;
        mesh.visible = false;
        mesh.scale.setScalar(0.0001);
        flame.interactionOffset.set(0, 0, 0);
        flame.interactionVelocity.set(0, 0, 0);
        flame.material.uniforms.opacity.value = 0;
        return;
      }

      if (flame.state === STATE_SPAWN) {
        const t = flame.currentTime / SPAWN_INTERVAL;
        const t2 = flame.currentTime / (SPAWN_INTERVAL + SPAWN_DOWN_INTERVAL);
        flame.offsetX = flame.distX * driftScale * t2;
        flame.offsetZ = flame.distZ * driftScale * t2;
        flame.offsetY += t * 0.4 * flame.yRatio * riseScale * frameScale;
        flame.currentScale = Math.max(0.0001, t);
      } else if (flame.state === STATE_SPAWN_DOWN) {
        const t2 =
          (flame.currentTime + SPAWN_INTERVAL) /
          (SPAWN_INTERVAL + SPAWN_DOWN_INTERVAL);
        flame.offsetX = flame.distX * driftScale * t2;
        flame.offsetZ = flame.distZ * driftScale * t2;
        flame.offsetY +=
          (0.6 * (1 - flame.currentTime / SPAWN_DOWN_INTERVAL) + 0.2) *
          flame.yRatio *
          riseScale *
          frameScale;
      } else if (flame.state === STATE_FLOATING) {
        flame.flowRatio = 0.5;
        flame.offsetX += flame.randFlyX * driftScale * frameScale;
        flame.offsetY += 0.2 * riseScale * frameScale;
        flame.offsetZ += flame.randFlyZ * driftScale * frameScale;
        flame.currentScale += 0.003 * frameScale;
      } else if (flame.state === STATE_IDLE) {
        flame.offsetY =
          flame.idleStartY + (flame.currentTime / 100) * riseScale;
        flame.currentScale += 0.002 * frameScale;
        if (flame.currentTime > IDLE_INTERVAL - 5000) {
          flame.opacity =
            1 - (flame.currentTime - (IDLE_INTERVAL - 5000)) / 5000;
        } else {
          flame.opacity = 1;
        }
      }

      flame.material.uniforms.time.value +=
        0.0005 * scaledDeltaMs * flame.animationTimeRatio * flame.flowRatio;
      flame.material.uniforms.baseRadius.value = flame.baseRadius;
      flame.material.uniforms.detail.value = THREE.MathUtils.lerp(
        detailMin,
        detailMax,
        flame.detailRatio
      );
      flame.material.uniforms.opacity.value = flame.opacity;
      updateFlamePalette(flame, palette);

      const curveT = wrapCurveT(
        THREE.MathUtils.clamp(
          flame.timeCount / FLAME_TRAVEL_DURATION_MS,
          0,
          1
        ) * pathTravel,
        closed
      );

      sampleCurveFrame(curveData, controlPoints, curveT, {
        position: _curvePos,
        tangent: _curveTan,
        normal: _sampleNormal,
        binormal: _sampleBinormal,
        scale: _sampleScale,
      });

      _localOffset
        .copy(_sampleNormal)
        .multiplyScalar(flame.offsetX * _sampleScale.x)
        .addScaledVector(_sampleBinormal, flame.offsetZ * _sampleScale.z)
        .multiplyScalar(worldScale);

      _localPosition.copy(_curvePos).add(_localOffset);
      integrateAttractorOffset(
        _localPosition,
        flame.interactionOffset,
        flame.interactionVelocity,
        resolvedAttractors,
        scaledDeltaSeconds,
        FLAME_ATTRACTOR_RETURN_STRENGTH,
        FLAME_ATTRACTOR_DAMPING,
        flameMaxInteractionOffset,
        FLAME_ATTRACTOR_DIRECTION_SCALE
      );
      _localPosition.add(flame.interactionOffset);

      mesh.visible = true;
      mesh.position.copy(_localPosition);
      mesh.scale.setScalar(
        Math.max(
          0.0001,
          worldScale * flame.radius * flame.currentScale * _sampleScale.x
        )
      );
    });

    particleState.elapsed += scaledDeltaMs / 1000;

    const { positions } = particleState;
    const { colors } = particleState;
    const { sizes } = particleState;
    for (let index = 0; index < particleState.active.length; index += 1) {
      const offset = index * 3;

      colors[offset] = palette.particleColor.r;
      colors[offset + 1] = palette.particleColor.g;
      colors[offset + 2] = palette.particleColor.b;

      if (index >= particleState.targetCount) {
        particleState.active[index] = false;
        particleState.particleTime[index] = 0;
        sizes[index] = 0;
        positions[offset] = 0;
        positions[offset + 1] = 0;
        positions[offset + 2] = 0;
        clearArrayVec3(particleState.interactionOffsets, offset);
        clearArrayVec3(particleState.interactionVelocities, offset);
        continue;
      }

      if (!particleState.active[index] || !showParticles) {
        sizes[index] = 0;
        positions[offset] = 0;
        positions[offset + 1] = 0;
        positions[offset + 2] = 0;
        continue;
      }

      if (
        particleState.particleTime[index] >
        MAXIMUM_PARTICLE_LIVE_TIME / 1000
      ) {
        particleState.active[index] = false;
        particleState.particleTime[index] = 0;
        sizes[index] = 0;
        positions[offset] = 0;
        positions[offset + 1] = 0;
        positions[offset + 2] = 0;
        clearArrayVec3(particleState.interactionOffsets, offset);
        clearArrayVec3(particleState.interactionVelocities, offset);
        continue;
      }

      const curveT = wrapCurveT(
        THREE.MathUtils.clamp(
          (particleState.particleTime[index] * 1000) /
            PARTICLE_TRAVEL_DURATION_MS,
          0,
          1
        ) * pathTravel,
        closed
      );

      sampleCurveFrame(curveData, controlPoints, curveT, {
        position: _curvePos,
        tangent: _curveTan,
        normal: _sampleNormal,
        binormal: _sampleBinormal,
        scale: _sampleScale,
      });

      const ac =
        particleSpread *
          (particleState.particleTime[index] /
            (MAXIMUM_PARTICLE_LIVE_TIME / 1000)) +
        0.01 * Math.sin(particleState.elapsed);
      const randDist =
        10 * Math.sin(0.3 * index + particleState.elapsed + Math.random() / 10);
      const radialNormalOffset =
        (ac * particleState.moveDest[offset] + randDist) *
        driftScale *
        _sampleScale.x *
        worldScale;
      const radialBinormalOffset =
        (ac * particleState.moveDest[offset + 2] + randDist) *
        driftScale *
        _sampleScale.z *
        worldScale;

      sizes[index] =
        particleSize *
        THREE.MathUtils.lerp(
          particleSizeMin,
          particleSizeMax,
          particleState.sizeRatios[index]
        ) *
        (3 + Math.sin(0.4 * index + particleState.elapsed));

      _particleBasePosition.set(
        _curvePos.x +
          _sampleNormal.x * radialNormalOffset +
          _sampleBinormal.x * radialBinormalOffset,
        _curvePos.y +
          _sampleNormal.y * radialNormalOffset +
          _sampleBinormal.y * radialBinormalOffset,
        _curvePos.z +
          _sampleNormal.z * radialNormalOffset +
          _sampleBinormal.z * radialBinormalOffset
      );

      _particleInteractionOffset.fromArray(
        particleState.interactionOffsets,
        offset
      );
      _particleInteractionVelocity.fromArray(
        particleState.interactionVelocities,
        offset
      );

      integrateAttractorOffset(
        _particleBasePosition,
        _particleInteractionOffset,
        _particleInteractionVelocity,
        resolvedAttractors,
        scaledDeltaSeconds,
        PARTICLE_ATTRACTOR_RETURN_STRENGTH,
        PARTICLE_ATTRACTOR_DAMPING,
        particleMaxInteractionOffset,
        PARTICLE_ATTRACTOR_DIRECTION_SCALE
      );

      _particleInteractionOffset.toArray(
        particleState.interactionOffsets,
        offset
      );
      _particleInteractionVelocity.toArray(
        particleState.interactionVelocities,
        offset
      );

      positions[offset] =
        _particleBasePosition.x + _particleInteractionOffset.x;
      positions[offset + 1] =
        _particleBasePosition.y + _particleInteractionOffset.y;
      positions[offset + 2] =
        _particleBasePosition.z + _particleInteractionOffset.z;

      particleState.particleTime[index] += scaledDeltaSeconds;
    }

    particleGeometry.attributes.position.needsUpdate = true;
    particleGeometry.attributes.customColor.needsUpdate = true;
    particleGeometry.attributes.size.needsUpdate = true;

    if (particlePointsRef.current) {
      particlePointsRef.current.visible = showParticles;
    }
  });

  return (
    <group ref={rootGroupRef}>
      {flamePool.map((flame, index) => (
        <mesh
          key={index}
          ref={(mesh) => {
            flameMeshRefs.current[index] = mesh;
          }}
          geometry={geometry}
          material={flame.material}
          frustumCulled={false}
          visible={false}
        />
      ))}

      <points
        ref={particlePointsRef}
        geometry={particleGeometry}
        material={particleMaterial}
        frustumCulled={false}
      />
    </group>
  );
}
