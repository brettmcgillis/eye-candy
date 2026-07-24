import * as THREE from 'three';

import getTankLayout, { MODEL_SAND_HEIGHT } from '../../../utils/tankLayout';

const MAX_PARTICLE_SPACING = 1.5;
const DEFAULT_MAX_PARTICLES = 18000;
const MIN_CELL_SIZE = 0.072;
const MIN_DOMAIN_MARGIN = 0.36;
const MIN_PARTICLE_SPACING = 0.78;
const PARTICLE_DIAMETER_SCALE = 1.58;
const TARGET_DEPTH_CELLS = 24;
const TARGET_HEIGHT_CELLS = 22;
const TARGET_WIDTH_CELLS = 36;
const SPLASH_PARTICLE_BUDGETS = Object.freeze({
  Small: 10000,
  Medium: DEFAULT_MAX_PARTICLES,
  Large: 30000,
  'Very Large': 45000,
});

export const BREAK_IMPULSE_DURATION = 0.42;
export const BREAK_IMPULSE_RADIUS = 4.5;
export const BREAK_IMPULSE_STRENGTH = 2.75;
export const OPEN_SIDE_ORDER = ['left', 'right', 'back', 'front'];

const sharedScaleMatrix = new THREE.Matrix4();
const sharedTranslationMatrix = new THREE.Matrix4();

function estimateParticleCount(fillMin, fillMax, spacing) {
  const width = Math.max(0, fillMax[0] - fillMin[0]);
  const height = Math.max(0, fillMax[1] - fillMin[1]);
  const depth = Math.max(0, fillMax[2] - fillMin[2]);

  return (
    Math.ceil(width / spacing) *
    Math.ceil(height / spacing) *
    Math.ceil(depth / spacing)
  );
}

function resolveParticleSpacing(fillMin, fillMax, maxParticles) {
  let spacing = MIN_PARTICLE_SPACING;

  while (
    estimateParticleCount(fillMin, fillMax, spacing) > maxParticles &&
    spacing < MAX_PARTICLE_SPACING
  ) {
    spacing += 0.08;
  }

  return spacing;
}

function getMaxParticles(tank) {
  return (
    SPLASH_PARTICLE_BUDGETS[tank.splashParticleBudget] ?? DEFAULT_MAX_PARTICLES
  );
}

function localToCellFrom(domainMinLocal, cellSize, point) {
  return point.map(
    (value, index) => (value - domainMinLocal[index]) / cellSize
  );
}

export function buildSplashStaticConfig(tank) {
  const layout = getTankLayout(tank);
  const maxParticles = getMaxParticles(tank);
  const waterBottom = -tank.height / 2 + MODEL_SAND_HEIGHT;
  const cellSize = THREE.MathUtils.clamp(
    Math.max(
      layout.innerWidth / TARGET_WIDTH_CELLS,
      layout.innerDepth / TARGET_DEPTH_CELLS,
      Math.max(layout.waterHeight, layout.innerHeight * 0.82) /
        TARGET_HEIGHT_CELLS
    ),
    MIN_CELL_SIZE,
    0.11
  );
  const xPad = Math.max(MIN_DOMAIN_MARGIN, layout.innerWidth * 0.55);
  const zPad = Math.max(MIN_DOMAIN_MARGIN, layout.innerDepth * 0.7);
  const yPadDown = Math.max(0.32, tank.height * 0.18);
  const yPadUp = Math.max(0.2, tank.height * 0.12);
  const domainMinLocal = [
    -layout.innerWidth / 2 - xPad,
    waterBottom - yPadDown,
    -layout.innerDepth / 2 - zPad,
  ];
  const domainMaxLocal = [
    layout.innerWidth / 2 + xPad,
    waterBottom + layout.waterHeight + yPadUp,
    layout.innerDepth / 2 + zPad,
  ];
  const domainSize = domainMaxLocal.map(
    (maxValue, index) =>
      Math.ceil((maxValue - domainMinLocal[index]) / cellSize) + 4
  );
  const initialContainMin = localToCellFrom(domainMinLocal, cellSize, [
    -layout.innerWidth / 2,
    waterBottom,
    -layout.innerDepth / 2,
  ]);
  const initialContainMax = localToCellFrom(domainMinLocal, cellSize, [
    layout.innerWidth / 2,
    waterBottom + layout.waterHeight,
    layout.innerDepth / 2,
  ]);
  const initialFillMin = [
    initialContainMin[0] + 1.5,
    initialContainMin[1] + 1.5,
    initialContainMin[2] + 1.5,
  ];
  const initialFillMax = [
    initialContainMax[0] - 1.5,
    initialContainMax[1] - 1.2,
    initialContainMax[2] - 1.5,
  ];
  const particleSpacing = resolveParticleSpacing(
    initialFillMin,
    initialFillMax,
    maxParticles
  );

  return {
    cellSize,
    domainMinLocal,
    domainSize,
    initialFillMin,
    initialFillMax,
    innerDepth: layout.innerDepth,
    innerWidth: layout.innerWidth,
    maxParticles,
    particleDiameterWorld: cellSize * PARTICLE_DIAMETER_SCALE,
    particleSpacing,
    waterBottom,
    signature: [
      domainSize.join('x'),
      cellSize.toFixed(4),
      maxParticles,
      tank.waterLevel.toFixed(4),
      layout.innerWidth.toFixed(4),
      layout.innerDepth.toFixed(4),
      waterBottom.toFixed(4),
    ].join(':'),
  };
}

export function getContainBounds(config, tank, activeWaterLevel) {
  const layout = getTankLayout({ ...tank, waterLevel: activeWaterLevel });
  const containMinLocal = [
    -layout.innerWidth / 2,
    config.waterBottom,
    -layout.innerDepth / 2,
  ];
  const containMaxLocal = [
    layout.innerWidth / 2,
    config.waterBottom + layout.waterHeight,
    layout.innerDepth / 2,
  ];
  const spillFloorLocal = Math.min(
    -tank.height / 2 + config.particleDiameterWorld * 0.5,
    config.waterBottom - config.particleDiameterWorld * 0.25
  );

  return {
    containMax: localToCellFrom(
      config.domainMinLocal,
      config.cellSize,
      containMaxLocal
    ),
    containMin: localToCellFrom(
      config.domainMinLocal,
      config.cellSize,
      containMinLocal
    ),
    layout,
    spillFloor: (spillFloorLocal - config.domainMinLocal[1]) / config.cellSize,
  };
}

export function localPointToCell(config, localPoint) {
  return localToCellFrom(config.domainMinLocal, config.cellSize, [
    localPoint.x,
    localPoint.y,
    localPoint.z,
  ]);
}

export function getOpenSides(runtime) {
  return OPEN_SIDE_ORDER.map((paneKey) =>
    runtime?.isPaneBroken?.(paneKey) ? 1 : 0
  );
}

export function getPaneDirection(paneKey) {
  switch (paneKey) {
    case 'left':
      return [-1, 0, 0];
    case 'right':
      return [1, 0, 0];
    case 'back':
      return [0, 0, -1];
    case 'front':
      return [0, 0, 1];
    default:
      return [0, 0, 0];
  }
}

export function createBreakImpulse(
  config,
  tank,
  paneKey,
  localPoint,
  containBounds
) {
  const center = localPointToCell(config, localPoint);
  const duration = Math.max(
    0.0001,
    tank.splashBreakImpulseDuration ?? BREAK_IMPULSE_DURATION
  );
  const radius = Math.max(
    0.0001,
    tank.splashBreakImpulseRadius ?? BREAK_IMPULSE_RADIUS
  );
  const strength = Math.max(
    0,
    tank.splashBreakImpulseStrength ?? BREAK_IMPULSE_STRENGTH
  );

  switch (paneKey) {
    case 'left':
      center[0] = containBounds.containMin[0] + 1.2;
      break;
    case 'right':
      center[0] = containBounds.containMax[0] - 1.2;
      break;
    case 'back':
      center[2] = containBounds.containMin[2] + 1.2;
      break;
    case 'front':
      center[2] = containBounds.containMax[2] - 1.2;
      break;
    default:
      break;
  }

  return {
    center,
    direction: getPaneDirection(paneKey),
    duration,
    remaining: duration,
    radius,
    strength,
  };
}

export function writeSimulationMatrix(targetMatrix, group, config) {
  targetMatrix.copy(group.matrixWorld);
  sharedTranslationMatrix.makeTranslation(
    config.domainMinLocal[0],
    config.domainMinLocal[1],
    config.domainMinLocal[2]
  );
  sharedScaleMatrix.makeScale(
    config.cellSize,
    config.cellSize,
    config.cellSize
  );
  targetMatrix.multiply(sharedTranslationMatrix);
  targetMatrix.multiply(sharedScaleMatrix);

  return targetMatrix;
}
