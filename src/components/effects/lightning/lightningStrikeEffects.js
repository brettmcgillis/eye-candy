import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { createSeededRandom } from './lightningUtils';

export const LIGHTNING_BASE_THICKNESS = 0.045;

const LIGHTNING_BASE_FLASH_RADIUS = 1.8;
const HOT_SPARK_COLOR = new THREE.Color(1, 0.92, 0.55);
const MID_SPARK_COLOR = new THREE.Color(1, 0.42, 0.05);
const COOL_SPARK_COLOR = new THREE.Color(0.7, 0.1, 0);

const BOLT_LAYER_PROFILE = [
  {
    alpha: 0.18,
    color: '#4764e1',
    thickness: 0.34,
  },
  {
    alpha: 0.55,
    color: '#1072bd',
    thickness: 0.13,
  },
  {
    alpha: 1,
    color: '#aceeff',
    thickness: 0.038,
  },
];

const SURFACE_CRACK_DEFAULTS = {
  angleJitter: 0.8,
  branchAngleMax: 1.45,
  branchAngleMin: 0.55,
  branchChance: 0.72,
  branchDepth: 2,
  branchLengthScaleMax: 0.7,
  branchLengthScaleMin: 0.3,
  branchStepsMax: 9,
  branchStepsMin: 5,
  countMax: 7,
  countMin: 4,
  coreColor: '#1086c1',
  fadeDuration: 2.8,
  edgeColor: '#4791e1',
  lengthMax: 3.9,
  lengthMin: 0.4,
  midColor: '#1088bc',
  revealDuration: 0.22,
  roughness: 0.725,
  thickAlpha: 1,
  thickFadeMultiplier: 0.6,
  thickHalfWidth: 0.08,
  thinAlpha: 0.55,
  thinHalfWidth: 0.025,
};

const SPARK_DEFAULTS = {
  countMax: 40,
  countMin: 30,
  depthScale: 160,
  gravity: 9.5,
  lifetimeMax: 1.3,
  lifetimeMin: 0.3,
  liftMax: 7,
  liftMin: 1,
  posJitter: 0.3,
  posOffset: 0.1,
  size: 0.18,
  speedMax: 6,
  speedMin: 1,
};

const DEBRIS_DEFAULTS = {
  baseOffset: 0.15,
  blueChance: 0.65,
  blueHueMax: 0.68,
  blueHueMin: 0.6,
  blueLightMax: 0.8,
  blueLightMin: 0.55,
  blueSat: 0.6,
  countMax: 8,
  countMin: 3,
  fadeMultiplier: 0.85,
  fadePower: 2,
  gravity: 18,
  heightMax: 0.16,
  heightMin: 0.04,
  lifetimeMax: 2.2,
  lifetimeMin: 1,
  liftMax: 4,
  liftMin: 1,
  rotationScale: 8,
  speedMax: 3.5,
  speedMin: 1,
  warmBMax: 0.5,
  warmBMin: 0.3,
  warmGMax: 0.5,
  warmGMin: 0.3,
  warmRMax: 0.6,
  warmRMin: 0.3,
  widthMax: 0.33,
  widthMin: 0.08,
};

const SHOCKWAVE_DEFAULTS = {
  alphaMultiplier: 0.4,
  colorA: '#ffb060',
  colorB: '#66b3ff',
  duration: 0.55,
  size: 10,
};

const GROUND_FLASH_DEFAULTS = {
  color: '#4db2ff',
  duration: 0.45,
  fadePower: 1.5,
  intensity: 0.35,
  radialPower: 1.2,
  size: 5,
};

const OVERLAY_DEFAULTS = {
  color: '#6496ff',
  decay: 8,
  maxAlpha: 0.6,
};

const IMPACT_EXTRA_DURATION = 0.5;
const TAIL_EXTRA_DURATION = 0.15;

function getScale(value, baseline) {
  return Math.max(value / baseline, 0.35);
}

function getEffectConfig(effects, key, defaultEnabled = true) {
  const value = effects?.[key];

  if (value === false) {
    return { enabled: false, overrides: {} };
  }

  if (value === true) {
    return { enabled: true, overrides: {} };
  }

  if (value == null) {
    return { enabled: defaultEnabled, overrides: {} };
  }

  const { enabled = true, ...overrides } = value;

  return { enabled, overrides };
}

function getAliasEffectConfig(effects, keys, defaultEnabled = true) {
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];

    if (effects?.[key] != null) {
      return getEffectConfig(effects, key, defaultEnabled);
    }
  }

  return { enabled: defaultEnabled, overrides: {} };
}

function toColor(value, fallback) {
  if (value instanceof THREE.Color) {
    return value.clone();
  }

  return new THREE.Color(value ?? fallback);
}

function withoutScale(overrides) {
  const rest = { ...overrides };
  delete rest.lengthScale;

  return rest;
}

export function createLightningVisualConfig({
  branchCount,
  coreColor,
  effects = null,
  fadeDuration,
  flashIntensity,
  flashRadius,
  glowColor,
  mainFractalDepth,
  renderer,
  roughness,
  strikeDuration,
  thickness,
}) {
  const thicknessScale = getScale(thickness, LIGHTNING_BASE_THICKNESS);
  const radiusScale = getScale(flashRadius, LIGHTNING_BASE_FLASH_RADIUS);
  const boltEffect = getEffectConfig(effects, 'bolt');
  const crackEffect = getAliasEffectConfig(effects, ['cracks', 'crack']);
  const debrisEffect = getEffectConfig(effects, 'debris');
  const groundFlashEffect = getEffectConfig(effects, 'groundFlash');
  const overlayEffect = getEffectConfig(effects, 'overlay');
  const shockwaveEffect = getEffectConfig(effects, 'shockwave');
  const sparksEffect = getEffectConfig(effects, 'sparks');
  const pointLightEffect = getEffectConfig(
    effects,
    'pointLight',
    flashIntensity > 0
  );
  const cameraShakeEffect = getEffectConfig(effects, 'cameraShake', false);
  const crackLengthScale = crackEffect.overrides.lengthScale ?? 1;
  const boltLayerProfile = boltEffect.overrides.layers ?? BOLT_LAYER_PROFILE;
  const crack = {
    ...SURFACE_CRACK_DEFAULTS,
    ...withoutScale(crackEffect.overrides),
    coreColor: toColor(
      crackEffect.overrides.coreColor,
      SURFACE_CRACK_DEFAULTS.coreColor
    ),
    delay: strikeDuration,
    edgeColor: toColor(
      crackEffect.overrides.edgeColor,
      SURFACE_CRACK_DEFAULTS.edgeColor
    ),
    enabled: crackEffect.enabled,
    lengthMax:
      (crackEffect.overrides.lengthMax ??
        SURFACE_CRACK_DEFAULTS.lengthMax * crackLengthScale) * radiusScale,
    lengthMin:
      (crackEffect.overrides.lengthMin ??
        SURFACE_CRACK_DEFAULTS.lengthMin * crackLengthScale) * radiusScale,
    midColor: toColor(
      crackEffect.overrides.midColor,
      SURFACE_CRACK_DEFAULTS.midColor
    ),
    thickHalfWidth:
      (crackEffect.overrides.thickHalfWidth ??
        SURFACE_CRACK_DEFAULTS.thickHalfWidth) * radiusScale,
    thinHalfWidth:
      (crackEffect.overrides.thinHalfWidth ??
        SURFACE_CRACK_DEFAULTS.thinHalfWidth) * radiusScale,
  };
  const debris = {
    ...DEBRIS_DEFAULTS,
    ...debrisEffect.overrides,
    baseOffset:
      (debrisEffect.overrides.baseOffset ?? DEBRIS_DEFAULTS.baseOffset) *
      radiusScale,
    enabled: debrisEffect.enabled,
    gravity:
      (debrisEffect.overrides.gravity ?? DEBRIS_DEFAULTS.gravity) * radiusScale,
    heightMax:
      (debrisEffect.overrides.heightMax ?? DEBRIS_DEFAULTS.heightMax) *
      radiusScale,
    heightMin:
      (debrisEffect.overrides.heightMin ?? DEBRIS_DEFAULTS.heightMin) *
      radiusScale,
    liftMax:
      (debrisEffect.overrides.liftMax ?? DEBRIS_DEFAULTS.liftMax) * radiusScale,
    liftMin:
      (debrisEffect.overrides.liftMin ?? DEBRIS_DEFAULTS.liftMin) * radiusScale,
    speedMax:
      (debrisEffect.overrides.speedMax ?? DEBRIS_DEFAULTS.speedMax) *
      radiusScale,
    speedMin:
      (debrisEffect.overrides.speedMin ?? DEBRIS_DEFAULTS.speedMin) *
      radiusScale,
    widthMax:
      (debrisEffect.overrides.widthMax ?? DEBRIS_DEFAULTS.widthMax) *
      radiusScale,
    widthMin:
      (debrisEffect.overrides.widthMin ?? DEBRIS_DEFAULTS.widthMin) *
      radiusScale,
  };
  const groundFlash = {
    color: toColor(
      groundFlashEffect.overrides.color,
      GROUND_FLASH_DEFAULTS.color
    ),
    duration:
      groundFlashEffect.overrides.duration ?? GROUND_FLASH_DEFAULTS.duration,
    enabled: groundFlashEffect.enabled,
    fadePower:
      groundFlashEffect.overrides.fadePower ?? GROUND_FLASH_DEFAULTS.fadePower,
    intensity:
      groundFlashEffect.overrides.intensity ?? GROUND_FLASH_DEFAULTS.intensity,
    radialPower:
      groundFlashEffect.overrides.radialPower ??
      GROUND_FLASH_DEFAULTS.radialPower,
    size:
      (groundFlashEffect.overrides.size ?? GROUND_FLASH_DEFAULTS.size) *
      radiusScale,
  };
  const overlay = {
    ...OVERLAY_DEFAULTS,
    ...overlayEffect.overrides,
    enabled: overlayEffect.enabled,
  };
  const shockwave = {
    alphaMultiplier:
      shockwaveEffect.overrides.alphaMultiplier ??
      SHOCKWAVE_DEFAULTS.alphaMultiplier,
    colorA: toColor(
      shockwaveEffect.overrides.colorA,
      SHOCKWAVE_DEFAULTS.colorA
    ),
    colorB: toColor(
      shockwaveEffect.overrides.colorB,
      SHOCKWAVE_DEFAULTS.colorB
    ),
    duration: shockwaveEffect.overrides.duration ?? SHOCKWAVE_DEFAULTS.duration,
    enabled: shockwaveEffect.enabled,
    size:
      (shockwaveEffect.overrides.size ?? SHOCKWAVE_DEFAULTS.size) * radiusScale,
  };
  const sparks = {
    ...SPARK_DEFAULTS,
    ...sparksEffect.overrides,
    delay: strikeDuration,
    depthScale:
      (sparksEffect.overrides.depthScale ?? SPARK_DEFAULTS.depthScale) *
      radiusScale,
    enabled: sparksEffect.enabled,
    gravity:
      (sparksEffect.overrides.gravity ?? SPARK_DEFAULTS.gravity) * radiusScale,
    liftMax:
      (sparksEffect.overrides.liftMax ?? SPARK_DEFAULTS.liftMax) * radiusScale,
    liftMin:
      (sparksEffect.overrides.liftMin ?? SPARK_DEFAULTS.liftMin) * radiusScale,
    posJitter:
      (sparksEffect.overrides.posJitter ?? SPARK_DEFAULTS.posJitter) *
      radiusScale,
    posOffset:
      (sparksEffect.overrides.posOffset ?? SPARK_DEFAULTS.posOffset) *
      radiusScale,
    size: sparksEffect.overrides.size ?? 2.5 * radiusScale,
    speedMax:
      (sparksEffect.overrides.speedMax ?? SPARK_DEFAULTS.speedMax) *
      radiusScale,
    speedMin:
      (sparksEffect.overrides.speedMin ?? SPARK_DEFAULTS.speedMin) *
      radiusScale,
  };
  const pointLight = {
    color: pointLightEffect.overrides.color ?? glowColor,
    decay: pointLightEffect.overrides.decay ?? 2,
    distanceMultiplier: pointLightEffect.overrides.distanceMultiplier ?? 6,
    enabled: pointLightEffect.enabled,
    intensity: pointLightEffect.overrides.intensity ?? flashIntensity,
    radius: pointLightEffect.overrides.radius ?? flashRadius,
  };
  const cameraShake = {
    decay: cameraShakeEffect.overrides.decay ?? 10,
    duration: cameraShakeEffect.overrides.duration ?? 0.45,
    enabled: cameraShakeEffect.enabled,
    frequency: cameraShakeEffect.overrides.frequency ?? 36,
    intensity: cameraShakeEffect.overrides.intensity ?? 0.08,
  };
  const effectDuration = Math.max(
    groundFlash.enabled ? groundFlash.duration : 0,
    shockwave.enabled ? strikeDuration + shockwave.duration : 0,
    crack.enabled
      ? strikeDuration + crack.revealDuration + crack.fadeDuration
      : 0,
    sparks.enabled ? strikeDuration + sparks.lifetimeMax : 0,
    debris.enabled ? strikeDuration + debris.lifetimeMax : 0,
    cameraShake.enabled ? cameraShake.duration : 0
  );

  return {
    boltLayers: boltLayerProfile.map((layer) => ({
      alpha: layer.alpha,
      color: toColor(layer.color, '#ffffff'),
      thickness: layer.thickness * thicknessScale,
    })),
    boltSpread: boltEffect.overrides.spread ?? 0.01,
    branchCount,
    coreColor,
    crack,
    cameraShake,
    fadeDuration,
    effectDuration,
    flashIntensity: pointLight.intensity,
    flashRadius,
    glowColor,
    debris,
    groundFlash,
    impactExtraDuration: IMPACT_EXTRA_DURATION,
    mainFractalDepth,
    overlay,
    pointLight,
    renderer,
    roughness,
    shockwave,
    sparks,
    strikeDuration,
    tailExtraDuration: TAIL_EXTRA_DURATION,
    thickness,
    thicknessScale,
  };
}

function generateCrackBranches(
  origin,
  angle,
  length,
  depth,
  config,
  random,
  all
) {
  const steps =
    config.branchStepsMin +
    Math.floor(random() * (config.branchStepsMax - config.branchStepsMin + 1));
  const points = [origin.clone()];
  let current = origin.clone();
  let nextAngle = angle;

  for (let index = 0; index < steps; index += 1) {
    nextAngle += (random() - 0.5) * config.angleJitter;
    const stepLength = (length / steps) * (0.6 + random() * 0.8);

    current = current.clone();
    current.x += Math.cos(nextAngle) * stepLength;
    current.y += Math.sin(nextAngle) * stepLength;
    points.push(current.clone());
  }

  all.push(points);

  if (depth <= 0 || random() >= config.branchChance || points.length < 3) {
    return;
  }

  const forkIndex = 1 + Math.floor(random() * (points.length - 2));
  const sign = random() > 0.5 ? 1 : -1;
  const branchAngle =
    nextAngle +
    sign *
      (config.branchAngleMin +
        random() * (config.branchAngleMax - config.branchAngleMin));
  const nextLength =
    length *
    (config.branchLengthScaleMin +
      random() * (config.branchLengthScaleMax - config.branchLengthScaleMin));

  generateCrackBranches(
    points[forkIndex].clone(),
    branchAngle,
    nextLength,
    depth - 1,
    config,
    random,
    all
  );
}

export function buildImpactCrackPaths(seed, config) {
  const random = createSeededRandom(seed * 29 + 17);
  const count =
    config.countMin +
    Math.floor(random() * (config.countMax - config.countMin + 1));
  const branches = [];

  for (let index = 0; index < count; index += 1) {
    const angle =
      (index / count) * Math.PI * 2 + (random() - 0.5) * config.angleJitter;
    const length =
      config.lengthMin + random() * (config.lengthMax - config.lengthMin);

    generateCrackBranches(
      new THREE.Vector3(),
      angle,
      length,
      config.branchDepth,
      config,
      random,
      branches
    );
  }

  return branches;
}

function buildCrackRibbonGeometry(points, halfWidth, alpha, fadeMultiplier) {
  const segments = points.length - 1;

  if (segments < 1) {
    return null;
  }

  const vertexCount = segments * 4;
  const positions = new Float32Array(vertexCount * 3);
  const ratios = new Float32Array(vertexCount);
  const sides = new Float32Array(vertexCount);
  const alphas = new Float32Array(vertexCount).fill(alpha);
  const fadeMultipliers = new Float32Array(vertexCount).fill(fadeMultiplier);
  const indices = [];

  for (let index = 0; index < segments; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const startRatio = index / (points.length - 1);
    const endRatio = (index + 1) / (points.length - 1);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy) || 1;
    const offsetX = (-dy / length) * halfWidth;
    const offsetY = (dx / length) * halfWidth;
    const vertexIndex = index * 4;
    const vertices = [
      [start.x - offsetX, start.y - offsetY, startRatio, -1],
      [start.x + offsetX, start.y + offsetY, startRatio, 1],
      [end.x - offsetX, end.y - offsetY, endRatio, -1],
      [end.x + offsetX, end.y + offsetY, endRatio, 1],
    ];

    vertices.forEach(([x, y, ratio, side], vertexOffset) => {
      const attributeOffset = (vertexIndex + vertexOffset) * 3;
      positions[attributeOffset] = x;
      positions[attributeOffset + 1] = y;
      positions[attributeOffset + 2] = 0;
      ratios[vertexIndex + vertexOffset] = ratio;
      sides[vertexIndex + vertexOffset] = side;
    });

    indices.push(
      vertexIndex,
      vertexIndex + 1,
      vertexIndex + 2,
      vertexIndex + 1,
      vertexIndex + 3,
      vertexIndex + 2
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aRatio', new THREE.BufferAttribute(ratios, 1));
  geometry.setAttribute('aSide', new THREE.BufferAttribute(sides, 1));
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
  geometry.setAttribute(
    'aFadeMult',
    new THREE.BufferAttribute(fadeMultipliers, 1)
  );
  geometry.setIndex(indices);

  return geometry;
}

export function buildLightningCrackGeometry(paths, config) {
  const geometries = [];

  for (let index = 0; index < paths.length; index += 1) {
    const path = paths[index];
    const thinGeometry = buildCrackRibbonGeometry(
      path,
      config.thinHalfWidth,
      config.thinAlpha,
      1
    );
    const thickGeometry = buildCrackRibbonGeometry(
      path,
      config.thickHalfWidth,
      config.thickAlpha,
      config.thickFadeMultiplier
    );

    if (thinGeometry) {
      geometries.push(thinGeometry);
    }

    if (thickGeometry) {
      geometries.push(thickGeometry);
    }
  }

  if (!geometries.length) {
    return null;
  }

  const merged = mergeGeometries(geometries);
  geometries.forEach((geometry) => geometry.dispose());

  return merged;
}

export function createShaderSparkGeometry(seed, config) {
  const random = createSeededRandom(seed * 43 + 31);
  const count =
    config.countMin +
    Math.floor(random() * (config.countMax - config.countMin + 1));
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const lifetimes = new Float32Array(count);
  const seeds = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (random() - 0.5) * config.posJitter;
    positions[index * 3 + 1] = (random() - 0.5) * config.posJitter;
    positions[index * 3 + 2] = config.posOffset;

    const angle = random() * Math.PI * 2;
    const speed =
      config.speedMin + random() * (config.speedMax - config.speedMin);
    const lift = config.liftMin + random() * (config.liftMax - config.liftMin);

    velocities[index * 3] = Math.cos(angle) * speed;
    velocities[index * 3 + 1] = Math.sin(angle) * speed;
    velocities[index * 3 + 2] = lift;
    lifetimes[index] =
      config.lifetimeMin + random() * (config.lifetimeMax - config.lifetimeMin);
    seeds[index] = random();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3));
  geometry.setAttribute('aLifetime', new THREE.BufferAttribute(lifetimes, 1));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

  return geometry;
}

function pickDebrisColor(random, config) {
  if (random() < config.blueChance) {
    const hue =
      config.blueHueMin + random() * (config.blueHueMax - config.blueHueMin);
    const light =
      config.blueLightMin +
      random() * (config.blueLightMax - config.blueLightMin);

    return new THREE.Color().setHSL(hue, config.blueSat, light);
  }

  return new THREE.Color(
    config.warmRMin + random() * (config.warmRMax - config.warmRMin),
    config.warmGMin + random() * (config.warmGMax - config.warmGMin),
    config.warmBMin + random() * (config.warmBMax - config.warmBMin)
  );
}

export function createDebrisBurst(seed, config) {
  const random = createSeededRandom(seed * 61 + 13);
  const count =
    config.countMin +
    Math.floor(random() * (config.countMax - config.countMin + 1));
  const shards = [];

  for (let index = 0; index < count; index += 1) {
    const angle = random() * Math.PI * 2;
    const speed =
      config.speedMin + random() * (config.speedMax - config.speedMin);
    const lift = config.liftMin + random() * (config.liftMax - config.liftMin);

    shards.push({
      active: false,
      baseColor: pickDebrisColor(random, config),
      baseScaleX:
        config.widthMin + random() * (config.widthMax - config.widthMin),
      baseScaleY:
        config.heightMin + random() * (config.heightMax - config.heightMin),
      index,
      lifetime:
        config.lifetimeMin +
        random() * (config.lifetimeMax - config.lifetimeMin),
      pos: new THREE.Vector3(0, 0, config.baseOffset),
      rotEuler: new THREE.Euler(),
      rx: (random() - 0.5) * config.rotationScale,
      ry: (random() - 0.5) * config.rotationScale,
      rz: (random() - 0.5) * config.rotationScale,
      time: 0,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      vz: lift,
    });
  }

  return {
    config,
    count,
    fadeColor: new THREE.Color(),
    hasStarted: false,
    shards,
    tempObject: new THREE.Object3D(),
  };
}

export function initializeDebrisMesh(state, mesh) {
  const instancedMesh = mesh;
  const { tempObject } = state;

  for (let index = 0; index < state.shards.length; index += 1) {
    const shard = state.shards[index];
    tempObject.position.copy(shard.pos);
    tempObject.rotation.copy(shard.rotEuler);
    tempObject.scale.set(shard.baseScaleX, shard.baseScaleY, 1);
    tempObject.updateMatrix();
    instancedMesh.setMatrixAt(shard.index, tempObject.matrix);
    instancedMesh.setColorAt(shard.index, shard.baseColor);
  }

  instancedMesh.instanceMatrix.needsUpdate = true;

  if (instancedMesh.instanceColor) {
    instancedMesh.instanceColor.needsUpdate = true;
  }
}

export function updateDebrisBurst(state, mesh, delta, shouldStart) {
  const burstState = state;
  const instancedMesh = mesh;
  const { config, fadeColor, tempObject } = burstState;

  if (shouldStart && !burstState.hasStarted) {
    burstState.hasStarted = true;

    for (let index = 0; index < burstState.shards.length; index += 1) {
      burstState.shards[index].active = true;
    }
  }

  if (!burstState.hasStarted) {
    return;
  }

  let colorDirty = false;
  let matrixDirty = false;

  for (let index = 0; index < burstState.shards.length; index += 1) {
    const shard = burstState.shards[index];

    if (shard.active) {
      shard.time += delta;

      if (shard.time >= shard.lifetime) {
        shard.active = false;
        tempObject.position.copy(shard.pos);
        tempObject.rotation.copy(shard.rotEuler);
        tempObject.scale.set(0, 0, 0);
        tempObject.updateMatrix();
        instancedMesh.setMatrixAt(shard.index, tempObject.matrix);
        matrixDirty = true;
      } else {
        const lifeT = shard.time / shard.lifetime;

        shard.pos.x += shard.vx * delta;
        shard.pos.y += shard.vy * delta;
        shard.vz -= config.gravity * delta;
        shard.pos.z = Math.max(0.05, shard.pos.z + shard.vz * delta);

        shard.rotEuler.x += shard.rx * delta;
        shard.rotEuler.y += shard.ry * delta;
        shard.rotEuler.z += shard.rz * delta;

        tempObject.position.copy(shard.pos);
        tempObject.rotation.copy(shard.rotEuler);
        tempObject.scale.set(shard.baseScaleX, shard.baseScaleY, 1);
        tempObject.updateMatrix();
        instancedMesh.setMatrixAt(shard.index, tempObject.matrix);
        matrixDirty = true;

        fadeColor
          .copy(shard.baseColor)
          .multiplyScalar(
            Math.max(0, (1 - lifeT ** config.fadePower) * config.fadeMultiplier)
          );
        instancedMesh.setColorAt(shard.index, fadeColor);
        colorDirty = true;
      }
    }
  }

  if (matrixDirty) {
    instancedMesh.instanceMatrix.needsUpdate = true;
  }

  if (colorDirty && instancedMesh.instanceColor) {
    instancedMesh.instanceColor.needsUpdate = true;
  }
}

function setSparkColor(colorBuffer, index, color, intensity) {
  const buffer = colorBuffer;
  const offset = index * 3;
  buffer[offset] = color.r * intensity;
  buffer[offset + 1] = color.g * intensity;
  buffer[offset + 2] = color.b * intensity;
}

function getSparkColor(progress, target) {
  if (progress < 0.35) {
    return target.copy(HOT_SPARK_COLOR).lerp(MID_SPARK_COLOR, progress / 0.35);
  }

  return target
    .copy(MID_SPARK_COLOR)
    .lerp(COOL_SPARK_COLOR, (progress - 0.35) / 0.65);
}

export function createSparkBurst(seed, config) {
  const random = createSeededRandom(seed * 43 + 31);
  const count =
    config.countMin +
    Math.floor(random() * (config.countMax - config.countMin + 1));
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const lifetimes = new Float32Array(count);
  const ages = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (random() - 0.5) * config.posJitter;
    positions[index * 3 + 1] = (random() - 0.5) * config.posJitter;
    positions[index * 3 + 2] = config.posOffset + random() * config.posOffset;

    const angle = random() * Math.PI * 2;
    const speed =
      config.speedMin + random() * (config.speedMax - config.speedMin);
    const lift = config.liftMin + random() * (config.liftMax - config.liftMin);

    velocities[index * 3] = Math.cos(angle) * speed;
    velocities[index * 3 + 1] = Math.sin(angle) * speed;
    velocities[index * 3 + 2] = lift;
    lifetimes[index] =
      config.lifetimeMin + random() * (config.lifetimeMax - config.lifetimeMin);

    setSparkColor(colors, index, HOT_SPARK_COLOR, 1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setDrawRange(0, count);

  return {
    ages,
    colors,
    count,
    geometry,
    lifetimes,
    positions,
    velocities,
  };
}

export function updateSparkBurst(state, delta, config) {
  const { ages } = state;
  const { colors } = state;
  const { geometry } = state;
  const { lifetimes } = state;
  const { positions } = state;
  const { velocities } = state;
  const dt = Math.min(delta, 0.05);
  const scratchColor = new THREE.Color();
  let hasActive = false;

  for (let index = 0; index < state.count; index += 1) {
    const lifetime = lifetimes[index];
    const nextAge = ages[index] + dt;
    ages[index] = nextAge;

    if (nextAge >= lifetime) {
      setSparkColor(colors, index, scratchColor.setRGB(0, 0, 0), 0);
    } else {
      const baseOffset = index * 3;
      const ageT = nextAge / lifetime;

      velocities[baseOffset] *= 0.99;
      velocities[baseOffset + 1] *= 0.99;
      velocities[baseOffset + 2] -= config.gravity * dt;

      positions[baseOffset] += velocities[baseOffset] * dt;
      positions[baseOffset + 1] += velocities[baseOffset + 1] * dt;
      positions[baseOffset + 2] = Math.max(
        0,
        positions[baseOffset + 2] + velocities[baseOffset + 2] * dt
      );

      const sparkColor = getSparkColor(ageT, scratchColor);
      const fade = Math.max(0, 1 - ageT * ageT);
      const intensity = fade * (0.65 + (1 - ageT) * 0.75);

      setSparkColor(colors, index, sparkColor, intensity);
      hasActive = true;
    }
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.color.needsUpdate = true;

  return hasActive;
}
