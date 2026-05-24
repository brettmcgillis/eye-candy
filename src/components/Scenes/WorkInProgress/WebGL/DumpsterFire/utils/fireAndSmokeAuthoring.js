import DUMPSTER_FIRE from '../../../../../../presets/fire/dumpsterFire';
import {
  cloneFireAndSmokeControlPoints,
  makeFireAndSmokeConfig,
} from '../../../../../elements/fireAndSmoke/fireAndSmokeDefaults';

const DEFAULT_NAME = 'Dumpster Fire And Smoke';
const DEFAULT_TYPE = 'FireAndSmoke';
const DEFAULT_POSITION = [-1, 1.4, 0];
const DEFAULT_ROTATION = [0, 0, 0];
const DEFAULT_SCALE = [1, 1, 1];
const NEW_INSTANCE_OFFSET = [0.6, 0, 0.15];

const cloneTuple = (value, fallback) =>
  Array.isArray(value) ? [...value] : [...fallback];

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
    points,
    ...config
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
    controlPoints: cloneFireAndSmokeControlPoints(points),
    config: makeFireAndSmokeConfig(config),
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
  return {
    name: seed.name ?? DEFAULT_NAME,
    type: seed.type ?? DEFAULT_TYPE,
    pos: cloneTuple(seed.pos, DEFAULT_POSITION),
    rot: cloneTuple(seed.rot, DEFAULT_ROTATION),
    scale: cloneTuple(seed.scale, DEFAULT_SCALE),
    visible: seed.visible ?? true,
    showHandles: seed.showHandles ?? true,
    showSpline: seed.showSpline ?? true,
    pointMode: seed.pointMode ?? 'translate',
    controlPoints: cloneFireAndSmokeControlPoints(seed.controlPoints),
    config: makeFireAndSmokeConfig(seed.config ?? {}),
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
