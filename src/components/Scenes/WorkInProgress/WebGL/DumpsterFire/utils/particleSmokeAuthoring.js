import * as THREE from 'three';

import DUMPSTER_FIRE from '../../../../../../presets/fire/dumpsterFire';
import {
  DEFAULT_SPLINE_CONFIG,
  cloneSplineInstance,
  filterParsedPresetByType,
  parsePreset,
} from '../../../../ToolBox/shared/splineDefaults';

const DEFAULT_NAME = 'Dumpster Particle Smoke';
const DEFAULT_TYPE = 'Smoke';
const DEFAULT_SMOKE_TYPE = 'Particle';
const DEFAULT_POSITION = [-1, 1.42, 0];
const DEFAULT_ROTATION = [0, 0, 0];
const DEFAULT_SCALE = [1, 1, 1];
const DEFAULT_POINT_MODE = 'translate';
const NEW_INSTANCE_OFFSET = [0.22, 0.12, 0.16];

const SERIALIZED_SMOKE_CONFIG_KEYS = [
  'name',
  'type',
  'smokeType',
  'visible',
  'tension',
  'closed',
  'showSpline',
  'showHelpers',
  'arcSegments',
  'showSmokeVolume',
  'particleCount',
  'particleSize',
  'particleColor',
  'opacity',
  'growth',
  'fadeExponent',
  'buoyancy',
  'rotSpeed',
  'blendMode',
  'springK',
  'flowSpeed',
  'damping',
  'turbulence',
  'turbulenceSpeed',
  'spawnSpread',
  'maxDrift',
  'fadeRate',
  'volParticleCount',
  'volSize',
  'volColor',
  'volOpacity',
  'volBlendMode',
  'volSpread',
  'volSpringK',
  'volDamping',
  'volTurbulence',
  'volTurbulenceSpeed',
  'volMaxDrift',
  'volGrowth',
  'volFadeExp',
  'volBuoyancy',
];

const DEFAULT_PARTICLE_SMOKE_CONFIG = {
  ...DEFAULT_SPLINE_CONFIG,
  name: DEFAULT_NAME,
  type: DEFAULT_TYPE,
  smokeType: DEFAULT_SMOKE_TYPE,
  visible: true,
  tension: 0.58,
  closed: false,
  showSpline: true,
  showHelpers: true,
  arcSegments: 200,
  showSmokeVolume: false,
  particleCount: 1800,
  particleSize: 0.22,
  particleColor: '#d08942',
  opacity: 0.16,
  growth: 1.35,
  fadeExponent: 1.4,
  buoyancy: 0.18,
  rotSpeed: 0.55,
  blendMode: 'Additive',
  springK: 3.5,
  flowSpeed: 0.075,
  damping: 0.11,
  turbulence: 1.35,
  turbulenceSpeed: 0.55,
  spawnSpread: 0.45,
  maxDrift: 3.2,
  fadeRate: 7,
  volParticleCount: 2400,
  volSize: 0.45,
  volColor: '#a8876b',
  volOpacity: 0.05,
  volBlendMode: 'Normal',
  volSpread: 0.5,
  volSpringK: 2.5,
  volDamping: 0.1,
  volTurbulence: 1.1,
  volTurbulenceSpeed: 0.4,
  volMaxDrift: 3.8,
  volGrowth: 1.35,
  volFadeExp: 1.2,
  volBuoyancy: 0.12,
};

function makePoint(position, scale, rotation = DEFAULT_ROTATION) {
  return {
    position: new THREE.Vector3(...position),
    rotation: new THREE.Euler(...rotation),
    scale: new THREE.Vector3(...scale),
  };
}

const DEFAULT_POINTS = [
  makePoint([0.12, 0, 0.24], [0.55, 0.55, 0.55]),
  makePoint([-0.22, 0.42, -0.14], [0.62, 0.62, 0.62]),
  makePoint([0.34, 0.86, 0.18], [0.72, 0.72, 0.72]),
  makePoint([-0.38, 1.3, 0.02], [0.84, 0.84, 0.84]),
  makePoint([0.44, 1.78, -0.2], [0.98, 0.98, 0.98]),
  makePoint([-0.34, 2.3, -0.04], [1.12, 1.12, 1.12]),
  makePoint([0.22, 2.86, 0.24], [1.28, 1.28, 1.28]),
  makePoint([-0.1, 3.44, -0.16], [1.46, 1.46, 1.46]),
  makePoint([0.02, 4.02, 0.1], [1.66, 1.66, 1.66]),
];

const FALLBACK_SPLINE = {
  pos: DEFAULT_POSITION,
  rot: DEFAULT_ROTATION,
  scale: DEFAULT_SCALE,
  pointMode: DEFAULT_POINT_MODE,
  points: DEFAULT_POINTS,
};

const cloneTuple = (value, fallback) =>
  Array.isArray(value) ? [...value] : [...fallback];

function toDumpsterParticleSmokeSpline(spline = {}) {
  const clonedSpline = cloneSplineInstance(spline);

  return {
    ...clonedSpline,
    pos: cloneTuple(clonedSpline.pos, DEFAULT_POSITION),
    rot: cloneTuple(clonedSpline.rot, DEFAULT_ROTATION),
    scale: cloneTuple(clonedSpline.scale, DEFAULT_SCALE),
    pointMode: clonedSpline.pointMode ?? DEFAULT_POINT_MODE,
    points:
      clonedSpline.points?.length > 0
        ? clonedSpline.points
        : cloneSplineInstance(FALLBACK_SPLINE).points,
  };
}

function toDumpsterParticleSmokeConfig(config = {}) {
  return {
    ...DEFAULT_PARTICLE_SMOKE_CONFIG,
    ...config,
    type: config.type ?? DEFAULT_TYPE,
    smokeType: config.smokeType ?? DEFAULT_SMOKE_TYPE,
  };
}

function buildDefaultDumpsterParticleSmokeState(preset = DUMPSTER_FIRE) {
  const parsedPreset = filterParsedPresetByType(parsePreset(preset), 'Smoke');

  return {
    splines: parsedPreset.splineInstances.map((spline) =>
      toDumpsterParticleSmokeSpline(spline)
    ),
    splineConfigs: parsedPreset.splineConfigs.map((config) =>
      toDumpsterParticleSmokeConfig(config)
    ),
  };
}

const DEFAULT_DUMPSTER_PARTICLE_SMOKE_STATE =
  buildDefaultDumpsterParticleSmokeState();

const DEFAULT_DUMPSTER_PARTICLE_SMOKE_SPLINES =
  DEFAULT_DUMPSTER_PARTICLE_SMOKE_STATE.splines.length > 0
    ? DEFAULT_DUMPSTER_PARTICLE_SMOKE_STATE.splines
    : [toDumpsterParticleSmokeSpline(FALLBACK_SPLINE)];

const DEFAULT_DUMPSTER_PARTICLE_SMOKE_CONFIGS =
  DEFAULT_DUMPSTER_PARTICLE_SMOKE_STATE.splineConfigs.length > 0
    ? DEFAULT_DUMPSTER_PARTICLE_SMOKE_STATE.splineConfigs
    : [toDumpsterParticleSmokeConfig()];

const formatNumber = (value) => {
  const rounded = Number(value.toFixed(3));
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded}`;
};

const formatTuple = (values) => `[${values.map(formatNumber).join(', ')}]`;

function formatPoint(point) {
  return [
    '      {',
    `        position: ${formatTuple(point.position.toArray())},`,
    `        rotation: ${formatTuple([
      point.rotation.x,
      point.rotation.y,
      point.rotation.z,
    ])},`,
    `        scale: ${formatTuple(point.scale.toArray())},`,
    '      }',
  ].join('\n');
}

function formatConfigValue(value) {
  if (typeof value === 'string') {
    return `'${value.replace(/'/g, "\\'")}'`;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return `${value}`;
  }

  return JSON.stringify(value);
}

export function cloneDumpsterParticleSmokeSpline(spline = {}) {
  return toDumpsterParticleSmokeSpline(spline);
}

export function cloneDumpsterParticleSmokeConfig(config = {}) {
  return toDumpsterParticleSmokeConfig(config);
}

export function cloneDumpsterParticleSmokeSplines(
  splines = DEFAULT_DUMPSTER_PARTICLE_SMOKE_SPLINES
) {
  return splines.map((spline) => cloneDumpsterParticleSmokeSpline(spline));
}

export function cloneDumpsterParticleSmokeConfigs(
  configs = DEFAULT_DUMPSTER_PARTICLE_SMOKE_CONFIGS
) {
  return configs.map((config) => cloneDumpsterParticleSmokeConfig(config));
}

export function makeNextDumpsterParticleSmokeSpline(splines = []) {
  const source =
    splines[splines.length - 1] ?? DEFAULT_DUMPSTER_PARTICLE_SMOKE_SPLINES[0];
  const next = cloneDumpsterParticleSmokeSpline(source);
  const zigZagOffset =
    splines.length % 2 === 0 ? NEW_INSTANCE_OFFSET[2] : -NEW_INSTANCE_OFFSET[2];

  return {
    ...next,
    pos: [
      next.pos[0] + NEW_INSTANCE_OFFSET[0],
      next.pos[1] + NEW_INSTANCE_OFFSET[1],
      next.pos[2] + zigZagOffset,
    ],
    pointMode: DEFAULT_POINT_MODE,
  };
}

export function makeNextDumpsterParticleSmokeConfig(configs = []) {
  const source =
    configs[configs.length - 1] ?? DEFAULT_DUMPSTER_PARTICLE_SMOKE_CONFIGS[0];
  const next = cloneDumpsterParticleSmokeConfig(source);

  return {
    ...next,
    name:
      configs.length === 0
        ? next.name
        : `${next.name ?? DEFAULT_NAME} ${configs.length + 1}`,
  };
}

export function serializeDumpsterParticleSmokeSplines(
  splines = [],
  splineConfigs = []
) {
  const body = splines
    .map((spline, index) => {
      const config = cloneDumpsterParticleSmokeConfig(
        splineConfigs[index] ?? DEFAULT_DUMPSTER_PARTICLE_SMOKE_CONFIGS[0]
      );
      const configEntries = SERIALIZED_SMOKE_CONFIG_KEYS.map((key) => {
        const value = config[key];
        return `    ${key}: ${formatConfigValue(value)},`;
      });
      const points = (spline.points ?? []).map((point) => formatPoint(point));

      return [
        '  makeSpline({',
        ...configEntries,
        `    pos: ${formatTuple(spline.pos ?? DEFAULT_POSITION)},`,
        `    rot: ${formatTuple(spline.rot ?? DEFAULT_ROTATION)},`,
        `    scale: ${formatTuple(spline.scale ?? DEFAULT_SCALE)},`,
        `    pointMode: '${spline.pointMode ?? DEFAULT_POINT_MODE}',`,
        '    points: [',
        points.join(',\n'),
        '    ],',
        '  })',
      ].join('\n');
    })
    .join(',\n');

  return body ? `[\n${body}\n]` : '[]';
}
