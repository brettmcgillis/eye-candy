import * as THREE from 'three';

import {
  DEFAULT_FIRE_AND_SMOKE_CONTROL_POINTS,
  cloneFireAndSmokeControlPoints,
  makeFireAndSmokeConfig,
} from '@elements/fireAndSmoke/fireAndSmokeDefaults';
import DUMPSTER_FIRE from '@presets/fire/dumpsterFire';

const DEFAULT_NAME = 'Dumpster Fire And Smoke';
const DEFAULT_TYPE = 'FireAndSmoke';
const DEFAULT_POSITION = [-1, 1.4, 0];
const DEFAULT_ROTATION = [0, 0, 0];
const DEFAULT_SCALE = [1, 1, 1];
const DEFAULT_POINT_POSITION = [0, 0, 0];
const DEFAULT_POINT_ROTATION = [0, 0, 0];
const DEFAULT_POINT_SCALE = [1, 1, 1];
const NEW_INSTANCE_OFFSET = [0.6, 0, 0.15];

const cloneTuple = (value, fallback) =>
  Array.isArray(value) ? [...value] : [...fallback];

function toVectorTuple(value, fallback) {
  if (Array.isArray(value)) {
    return [...value];
  }

  if (typeof value?.toArray === 'function') {
    return value.toArray();
  }

  if (typeof value?.x === 'number') {
    return [value.x, value.y ?? fallback[1], value.z ?? fallback[2]];
  }

  return [...fallback];
}

function toVector3(value, fallback) {
  return new THREE.Vector3(...toVectorTuple(value, fallback));
}

function toEuler(value, fallback) {
  const [x, y, z] = toVectorTuple(value, fallback);
  return new THREE.Euler(x, y, z, value?.order ?? 'XYZ');
}

function normalizeControlPoint(point = {}) {
  return {
    position: toVector3(point.position, DEFAULT_POINT_POSITION),
    rotation: toEuler(point.rotation, DEFAULT_POINT_ROTATION),
    scale: toVector3(point.scale, DEFAULT_POINT_SCALE),
  };
}

function normalizeControlPoints(
  points = DEFAULT_FIRE_AND_SMOKE_CONTROL_POINTS
) {
  return points.map((point) => normalizeControlPoint(point));
}

function toDumpsterFireAndSmokeSeed(seed = {}) {
  const {
    name = DEFAULT_NAME,
    type = DEFAULT_TYPE,
    visible = true,
    showHandles = true,
    showSpline = true,
    pointMode = 'translate',
    pos,
    rot,
    scale,
    controlPoints,
    points,
    config: nestedConfig,
    ...configOverrides
  } = seed;

  return {
    name,
    type,
    pos: cloneTuple(pos, DEFAULT_POSITION),
    rot: cloneTuple(rot, DEFAULT_ROTATION),
    scale: cloneTuple(scale, DEFAULT_SCALE),
    visible,
    showHandles,
    showSpline,
    pointMode,
    controlPoints: normalizeControlPoints(controlPoints ?? points),
    config: makeFireAndSmokeConfig(nestedConfig ?? configOverrides),
  };
}

function buildDefaultDumpsterFireAndSmokeSeeds(preset = DUMPSTER_FIRE) {
  return (preset?.splines ?? [])
    .filter((spline) => spline?.type === DEFAULT_TYPE)
    .map((spline) => toDumpsterFireAndSmokeSeed(spline));
}

const FALLBACK_DUMPSTER_FIRE_AND_SMOKE_INSTANCE_SEED = {
  name: DEFAULT_NAME,
  type: DEFAULT_TYPE,
  pos: DEFAULT_POSITION,
  rot: DEFAULT_ROTATION,
  scale: DEFAULT_SCALE,
  visible: true,
  showHandles: true,
  showSpline: true,
  pointMode: 'translate',
  controlPoints: cloneFireAndSmokeControlPoints(),
  config: makeFireAndSmokeConfig(),
};

// Source of truth lives in src/presets/fire/dumpsterFire.js under a
// FireAndSmoke spline entry. DumpsterFire reads that spline data directly.
export const DUMPSTER_FIRE_AND_SMOKE_INSTANCE_SEEDS =
  buildDefaultDumpsterFireAndSmokeSeeds();

const DEFAULT_DUMPSTER_FIRE_AND_SMOKE_INSTANCE_SEEDS =
  DUMPSTER_FIRE_AND_SMOKE_INSTANCE_SEEDS.length > 0
    ? DUMPSTER_FIRE_AND_SMOKE_INSTANCE_SEEDS
    : [FALLBACK_DUMPSTER_FIRE_AND_SMOKE_INSTANCE_SEED];

const formatNumber = (value) => {
  const rounded = Number(value.toFixed(3));
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded}`;
};

const formatTuple = (values) => `[${values.map(formatNumber).join(', ')}]`;

function formatControlPoint(point) {
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

  if (Array.isArray(value)) {
    return formatTuple(value);
  }

  return JSON.stringify(value);
}

function formatConfigEntries(config) {
  return Object.entries(config).map(
    ([key, value]) => `    ${key}: ${formatConfigValue(value)},`
  );
}

export function cloneDumpsterFireAndSmokeSeed(seed = {}) {
  const {
    name = DEFAULT_NAME,
    type = DEFAULT_TYPE,
    pos,
    rot,
    scale,
    visible = true,
    showHandles = true,
    showSpline = true,
    pointMode = 'translate',
    controlPoints,
    points,
    config,
    ...configOverrides
  } = seed;

  return {
    name,
    type,
    pos: cloneTuple(pos, DEFAULT_POSITION),
    rot: cloneTuple(rot, DEFAULT_ROTATION),
    scale: cloneTuple(scale, DEFAULT_SCALE),
    visible,
    showHandles,
    showSpline,
    pointMode,
    controlPoints: normalizeControlPoints(controlPoints ?? points),
    config: makeFireAndSmokeConfig(config ?? configOverrides),
  };
}

export function cloneDumpsterFireAndSmokeSeeds(
  seeds = DEFAULT_DUMPSTER_FIRE_AND_SMOKE_INSTANCE_SEEDS
) {
  return seeds.map((seed) => cloneDumpsterFireAndSmokeSeed(seed));
}

export function makeNextDumpsterFireAndSmokeSeed(instances = []) {
  const source =
    instances[instances.length - 1] ??
    DEFAULT_DUMPSTER_FIRE_AND_SMOKE_INSTANCE_SEEDS[0];
  const next = cloneDumpsterFireAndSmokeSeed(source);
  const zigZagOffset =
    instances.length % 2 === 0
      ? NEW_INSTANCE_OFFSET[2]
      : -NEW_INSTANCE_OFFSET[2];

  return {
    ...next,
    pos: [
      next.pos[0] + NEW_INSTANCE_OFFSET[0],
      next.pos[1] + NEW_INSTANCE_OFFSET[1],
      next.pos[2] + zigZagOffset,
    ],
    visible: true,
    showHandles: true,
    showSpline: true,
    pointMode: 'translate',
  };
}

export function serializeDumpsterFireAndSmokeSeeds(instances = []) {
  const body = instances
    .map((instance) => {
      const controlPoints = instance.controlPoints
        .map((point) => formatControlPoint(point))
        .join(',\n');
      const configEntries = formatConfigEntries(instance.config ?? {});

      return [
        '  makeSpline({',
        `    name: '${instance.name ?? DEFAULT_NAME}',`,
        `    type: '${instance.type ?? DEFAULT_TYPE}',`,
        `    visible: ${instance.visible ?? true},`,
        `    showHandles: ${instance.showHandles ?? true},`,
        `    showSpline: ${instance.showSpline ?? true},`,
        `    pointMode: '${instance.pointMode ?? 'translate'}',`,
        ...configEntries,
        `    pos: ${formatTuple(instance.pos)},`,
        `    rot: ${formatTuple(instance.rot)},`,
        `    scale: ${formatTuple(instance.scale)},`,
        '    points: [',
        controlPoints,
        '    ],',
        '  })',
      ].join('\n');
    })
    .join(',\n');

  return `[\n${body}\n]`;
}
