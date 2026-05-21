import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const E = (x, y, z) => new THREE.Euler(x, y, z);
const S = (x, y, z) => new THREE.Vector3(x, y, z);

export const FIRE_AND_SMOKE_FIRE_COLORS = {
  lightColor2: '#ff8700',
  lightColor: '#f7f342',
  normalColor: '#f7a90e',
  darkColor2: '#ff9800',
  greyColor: '#3c342f',
  darkColor: '#181818',
  particleColor: '#ffb400',
};

export const FIRE_AND_SMOKE_SMOKE_COLORS = {
  lightColor2: '#d0cbc5',
  lightColor: '#a9a298',
  normalColor: '#6f675f',
  darkColor2: '#4a443f',
  greyColor: '#3c342f',
  darkColor: '#181818',
  particleColor: '#9b9388',
};

export const DEFAULT_FIRE_AND_SMOKE_CONTROL_POINTS = [
  {
    position: V(0, 0, 0),
    rotation: E(0, 0, 0),
    scale: S(1, 1, 1),
  },
  {
    position: V(0, 0.9, 0),
    rotation: E(0, 0, 0),
    scale: S(1, 1, 1),
  },
  {
    position: V(0, 1.8, 0),
    rotation: E(0, 0, 0),
    scale: S(1, 1, 1),
  },
  {
    position: V(0, 2.7, 0),
    rotation: E(0, 0, 0),
    scale: S(1, 1, 1),
  },
  {
    position: V(0, 3.6, 0),
    rotation: E(0, 0, 0),
    scale: S(1, 1, 1),
  },
  {
    position: V(0, 4.5, 0),
    rotation: E(0, 0, 0),
    scale: S(1, 1, 1),
  },
];

export const DEFAULT_FIRE_AND_SMOKE_CONFIG = {
  closed: false,
  timeScale: 3,
  spawnIntervalMs: 200,
  pathTravel: 1,
  worldScale: 0.01,
  poolSize: 160,
  particleCount: 500,
  particleSpread: 1,
  particleSizeMin: 0.5,
  particleSizeMax: 1.5,
  particlePointScale: 30,
  radiusMin: 1,
  radiusMax: 1,
  shapeRadiusMin: 8,
  shapeRadiusMax: 13,
  detailMin: 5,
  detailMax: 8.5,
  driftScale: 1,
  riseScale: 1,
  showParticles: true,
  ...FIRE_AND_SMOKE_FIRE_COLORS,
};

export function cloneFireAndSmokeControlPoints(
  points = DEFAULT_FIRE_AND_SMOKE_CONTROL_POINTS
) {
  return points.map((point) => ({
    position: point.position.clone(),
    rotation: (point.rotation ?? new THREE.Euler()).clone(),
    scale: (point.scale ?? new THREE.Vector3(1, 1, 1)).clone(),
  }));
}

export function makeFireAndSmokeConfig(overrides = {}) {
  return {
    ...DEFAULT_FIRE_AND_SMOKE_CONFIG,
    ...overrides,
  };
}

export function makeFireAndSmokeFireConfig(overrides = {}) {
  return makeFireAndSmokeConfig({
    ...FIRE_AND_SMOKE_FIRE_COLORS,
    ...overrides,
  });
}

export function makeFireAndSmokeSmokeConfig(overrides = {}) {
  return makeFireAndSmokeConfig({
    ...FIRE_AND_SMOKE_SMOKE_COLORS,
    ...overrides,
  });
}