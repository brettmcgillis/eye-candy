/* eslint-disable no-continue */

/* eslint-disable react/no-array-index-key */

/* eslint-disable no-param-reassign */

/* eslint-disable no-underscore-dangle */
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  attribute,
  float,
  int,
  mix,
  mx_fractal_noise_float as mxFractalNoise,
  normalLocal,
  positionLocal,
  positionView,
  texture as tslTexture,
  uniform,
  uv,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

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
  const uniforms = {
    time: uniform(0),
    seed: uniform(seed),
    detail: uniform(detail),
    baseRadius: uniform(10.5),
    opacity: uniform(1),
    colLight: uniform(new THREE.Color('#ffffff')),
    colNormal: uniform(new THREE.Color('#ffffff')),
    colDark: uniform(new THREE.Color('#000000')),
  };

  const animatedSeed = uniforms.time.add(uniforms.seed);
  const animatedSeedVec = vec3(animatedSeed, animatedSeed, animatedSeed);
  const flameRange = mxFractalNoise(
    normalLocal.mul(float(0.6)).add(animatedSeedVec),
    int(5),
    float(2.0),
    float(0.5)
  )
    .mul(float(0.5))
    .add(float(0.5))
    .clamp(0.0, 1.0);
  const billow = mxFractalNoise(
    positionLocal
      .mul(uniforms.baseRadius)
      .mul(float(0.05))
      .add(
        vec3(
          uniforms.time.mul(float(2.0)),
          uniforms.time.mul(float(2.0)),
          uniforms.time.mul(float(2.0))
        )
      ),
    int(3),
    float(2.0),
    float(0.5)
  )
    .mul(float(2.0))
    .sub(float(1.0))
    .mul(float(2.0));
  const displacement = uniforms.detail.mul(flameRange).add(billow);
  const lightToNormal = flameRange.div(float(0.4)).clamp(0.0, 1.0);
  const normalToDark = flameRange
    .sub(float(0.4))
    .div(float(0.2))
    .clamp(0.0, 1.0);
  const midColor = mix(uniforms.colLight, uniforms.colNormal, lightToNormal);

  const material = new THREE.MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });

  material.positionNode = positionLocal
    .mul(uniforms.baseRadius)
    .add(normalLocal.mul(displacement));
  material.colorNode = mix(midColor, uniforms.colDark, normalToDark);
  material.opacityNode = uniforms.opacity;

  material.uniforms = uniforms;

  return material;
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

export default function FireAndSmokeGPU({
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
  const particleNodes = useMemo(
    () => ({
      pointScale: uniform(30),
    }),
    []
  );
  const particleMaterial = useMemo(() => {
    const sizeNode = attribute('aSize', 'float')
      .mul(particleNodes.pointScale)
      .div(positionView.z.negate());
    const texSample = tslTexture(particleTexture, uv());

    const material = new THREE.PointsNodeMaterial({
      transparent: true,
      depthTest: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      sizeAttenuation: false,
      toneMapped: false,
    });

    material.positionNode = attribute('aPosition', 'vec3');
    material.sizeNode = sizeNode;
    material.colorNode = attribute('aColor', 'vec3')
      .mul(texSample.rgb)
      .toVec4(texSample.a);

    return material;
  }, [particleNodes, particleTexture]);
  const effectivePoolSize = Math.max(
    poolSize,
    Math.ceil(TOTAL_FLAME_LIFETIME_MS / Math.max(1, spawnIntervalMs)) + 1
  );
  const [flamePool, setFlamePool] = useState(() =>
    buildFlamePool(effectivePoolSize)
  );
  const [particleMesh, setParticleMesh] = useState(null);
  const particleStateRef = useRef(null);
  const particleGeometryRef = useRef(null);
  const particleMeshRef = useRef(null);
  const particleCapacityRef = useRef(0);
  const flamePoolRef = useRef(flamePool);
  const initializedFlameCountRef = useRef(0);

  const flameMeshRefs = useRef([]);
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
    particleNodes.pointScale.value = particlePointScale;
  }, [particleNodes, particlePointScale]);

  useEffect(() => {
    const prevState = particleStateRef.current;
    const nextState = resizeParticleState(prevState, particleCount);
    particleStateRef.current = nextState;

    const capacity = nextState.active.length;
    const currentMesh = particleMeshRef.current;
    if (currentMesh && particleCapacityRef.current >= capacity) {
      currentMesh.material = particleMaterial;
      currentMesh.count = Math.min(
        nextState.targetCount,
        particleCapacityRef.current
      );
      return;
    }

    particleGeometryRef.current?.dispose();

    const nextGeometry = new THREE.PlaneGeometry(1, 1);
    const positionAttr = new THREE.InstancedBufferAttribute(
      nextState.positions,
      3
    );
    positionAttr.usage = THREE.DynamicDrawUsage;
    nextGeometry.setAttribute('aPosition', positionAttr);

    const colorAttr = new THREE.InstancedBufferAttribute(nextState.colors, 3);
    colorAttr.usage = THREE.DynamicDrawUsage;
    nextGeometry.setAttribute('aColor', colorAttr);

    const sizeAttr = new THREE.InstancedBufferAttribute(nextState.sizes, 1);
    sizeAttr.usage = THREE.DynamicDrawUsage;
    nextGeometry.setAttribute('aSize', sizeAttr);

    const identityMat = new THREE.Matrix4();
    const nextMesh = new THREE.InstancedMesh(
      nextGeometry,
      particleMaterial,
      capacity
    );
    for (let index = 0; index < capacity; index += 1) {
      nextMesh.setMatrixAt(index, identityMat);
    }
    nextMesh.instanceMatrix.needsUpdate = true;
    nextMesh.frustumCulled = false;
    nextMesh.count = Math.min(nextState.targetCount, capacity);

    particleGeometryRef.current = nextGeometry;
    particleMeshRef.current = nextMesh;
    particleCapacityRef.current = capacity;
    setParticleMesh(nextMesh);
  }, [particleCount, particleMaterial]);

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

  useEffect(
    () => () => {
      geometry.dispose();
      particleGeometryRef.current?.dispose();
      particleMaterial.dispose();
      particleTexture.dispose();
      flamePoolRef.current.forEach((flame) => flame.material.dispose());
    },
    [geometry, particleMaterial, particleTexture]
  );

  useEffect(() => {
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
    const activeParticleGeometry = particleGeometryRef.current;
    if (!particleState || !activeParticleGeometry) {
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

    activeParticleGeometry.attributes.aPosition.needsUpdate = true;
    activeParticleGeometry.attributes.aColor.needsUpdate = true;
    activeParticleGeometry.attributes.aSize.needsUpdate = true;

    if (particleMeshRef.current) {
      particleMeshRef.current.visible = showParticles;
      particleMeshRef.current.count = Math.min(
        particleState.targetCount,
        particleCapacityRef.current
      );
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

      {particleMesh ? <primitive object={particleMesh} /> : null}
    </group>
  );
}
