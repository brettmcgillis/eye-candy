import { radians } from '../../utils/math';

export const SCENE_LIGHT_TYPES = Object.freeze({
  ambient: 'ambient',
  hemisphere: 'hemisphere',
  directional: 'directional',
  point: 'point',
  spot: 'spot',
  rectArea: 'rectArea',
});

const SHADOW_CAPABLE_TYPES = Object.freeze(['directional', 'point', 'spot']);
const TARGET_TYPES = Object.freeze(['directional', 'spot']);

const TYPE_DEFAULTS = Object.freeze({
  ambient: { color: '#ffffff', intensity: 0.3 },
  hemisphere: {
    skyColor: '#b9d4ff',
    groundColor: '#30281f',
    intensity: 0.6,
  },
  directional: {
    color: '#ffffff',
    intensity: 1.5,
    position: [5, 8, 5],
    target: [0, 0, 0],
  },
  point: {
    color: '#ffffff',
    intensity: 15,
    position: [0, 3, 0],
    distance: 0,
    decay: 2,
  },
  spot: {
    color: '#ffffff',
    intensity: 20,
    position: [3, 6, 3],
    target: [0, 0, 0],
    angle: 30,
    penumbra: 0.5,
    distance: 0,
    decay: 2,
  },
  rectArea: {
    color: '#ffffff',
    intensity: 5,
    position: [0, 4, 4],
    rotation: [0, 0, 0],
    width: 4,
    height: 4,
  },
});

const DEFAULT_SHADOW_MAP_SIZE = 2048;

export function isLightingControlKey(key) {
  return key === 'preset' || /^light[A-Z]/.test(key);
}

// Scene controls objects change identity on every Leva edit, so
// buildLighting(controls) can't be memoized on `controls` directly — any
// unrelated edit would rebuild the rig and remount its lights. Memoize on
// this key instead: it only changes when a lighting control changes.
export function getLightingControlsKey(controls = {}) {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(controls).filter(([key]) => isLightingControlKey(key))
    )
  );
}

// Mirrors buildCameraControlOverridesFromSnapshot: seeds the generated
// lighting schema with the ACTIVE preset's values on first mount, since the
// static slot declaration alone doesn't know them.
export function buildLightingControlOverridesFromSnapshot(snapshot = {}) {
  const overrides = {};

  Object.keys(snapshot ?? {}).forEach((key) => {
    if (key !== 'preset' && isLightingControlKey(key)) {
      overrides[key] = { value: snapshot[key] };
    }
  });

  return overrides;
}

function toFiniteNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

export function toVectorTuple(value, fallback) {
  if (Array.isArray(value)) {
    return [
      toFiniteNumber(value[0], fallback[0]),
      toFiniteNumber(value[1], fallback[1]),
      toFiniteNumber(value[2], fallback[2]),
    ];
  }

  if (value && typeof value === 'object') {
    return [
      toFiniteNumber(value.x, fallback[0]),
      toFiniteNumber(value.y, fallback[1]),
      toFiniteNumber(value.z, fallback[2]),
    ];
  }

  return [...fallback];
}

export function toVectorObject(value, fallback) {
  const [x, y, z] = toVectorTuple(value, fallback);

  return { x, y, z };
}

// `radius` here is the spherical arm length, deliberately not named `distance`
// — that stays the three.js point/spot falloff prop and would collide.
export function sphericalToPosition({ azimuth, elevation, radius }) {
  const azimuthRadians = radians(azimuth);
  const elevationRadians = radians(elevation);
  const horizontal = Math.cos(elevationRadians) * radius;

  return [
    Math.sin(azimuthRadians) * horizontal,
    Math.sin(elevationRadians) * radius,
    Math.cos(azimuthRadians) * horizontal,
  ];
}

function isSphericalDeclaration(value) {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (value.azimuth !== undefined || value.elevation !== undefined)
  );
}

function normalizePlacement(value, fallback) {
  if (isSphericalDeclaration(value)) {
    return {
      positionMode: 'spherical',
      spherical: {
        azimuth: toFiniteNumber(value.azimuth, 45),
        elevation: toFiniteNumber(value.elevation, 45),
        radius: toFiniteNumber(value.radius, 10),
      },
    };
  }

  return {
    position: toVectorTuple(value, fallback),
    positionMode: 'xyz',
  };
}

function normalizeShadow(value, type) {
  if (!value || !SHADOW_CAPABLE_TYPES.includes(type)) {
    return null;
  }

  const config = value && typeof value === 'object' ? value : {};
  const mapSize =
    typeof value === 'number'
      ? value
      : toFiniteNumber(config.mapSize, DEFAULT_SHADOW_MAP_SIZE);

  return {
    bias: toFiniteNumber(config.bias, -0.0005),
    // Directional shadow cameras are orthographic; one half-extent drives all
    // four frustum bounds, matching how SkyRig/FractalAutomata derive theirs.
    extent: toFiniteNumber(config.extent, 12),
    far: toFiniteNumber(config.far, 100),
    intensity: toFiniteNumber(config.intensity, 1),
    mapSize,
    near: toFiniteNumber(config.near, 0.5),
    normalBias: toFiniteNumber(config.normalBias, 0),
    radius: toFiniteNumber(config.radius, 1),
  };
}

function normalizeLayer(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return { channel: value, mode: 'set' };
  }

  return {
    channel: toFiniteNumber(value.channel, 0),
    mode: value.mode === 'enable' ? 'enable' : 'set',
  };
}

function toPascalCase(value) {
  const segments = `${value ?? ''}`
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`);

  return segments.join('');
}

export function getLightSlotPrefix(slotId) {
  return `light${toPascalCase(slotId)}`;
}

function formatSlotLabel(slotId) {
  return toPascalCase(slotId).replace(/([a-z0-9])([A-Z])/g, '$1 $2');
}

function normalizeSlot(slotId, declaration) {
  const type = SCENE_LIGHT_TYPES[declaration?.type] ?? 'directional';
  const defaults = TYPE_DEFAULTS[type];

  return {
    ...defaults,
    ...normalizePlacement(
      declaration?.position,
      defaults.position ?? [0, 0, 0]
    ),
    ...(declaration?.color ? { color: declaration.color } : {}),
    ...(declaration?.skyColor ? { skyColor: declaration.skyColor } : {}),
    ...(declaration?.groundColor
      ? { groundColor: declaration.groundColor }
      : {}),
    angle: toFiniteNumber(declaration?.angle, defaults.angle),
    debug: !!declaration?.debug,
    decay: toFiniteNumber(declaration?.decay, defaults.decay),
    distance: toFiniteNumber(declaration?.distance, defaults.distance),
    enabled: declaration?.enabled ?? true,
    height: toFiniteNumber(declaration?.height, defaults.height),
    id: slotId,
    intensity: toFiniteNumber(declaration?.intensity, defaults.intensity),
    label: declaration?.label ?? formatSlotLabel(slotId),
    layer: normalizeLayer(declaration?.layer),
    penumbra: toFiniteNumber(declaration?.penumbra, defaults.penumbra),
    prefix: getLightSlotPrefix(slotId),
    ...(defaults.rotation
      ? { rotation: toVectorTuple(declaration?.rotation, defaults.rotation) }
      : {}),
    shadow: normalizeShadow(declaration?.shadow, type),
    ...(TARGET_TYPES.includes(type)
      ? { target: toVectorTuple(declaration?.target, defaults.target) }
      : {}),
    type,
    width: toFiniteNumber(declaration?.width, defaults.width),
  };
}

export function normalizeSceneLightingDeclaration(lighting = {}) {
  const slots = lighting?.slots ?? lighting ?? {};

  return {
    enabled: lighting?.enabled ?? true,
    slots: Object.entries(slots)
      .filter(([, declaration]) => !!declaration?.type)
      .map(([slotId, declaration]) => normalizeSlot(slotId, declaration)),
  };
}

function resolveSlotPosition(slot, controls) {
  if (slot.positionMode === 'spherical') {
    return sphericalToPosition({
      azimuth: toFiniteNumber(
        controls[`${slot.prefix}Azimuth`],
        slot.spherical.azimuth
      ),
      elevation: toFiniteNumber(
        controls[`${slot.prefix}Elevation`],
        slot.spherical.elevation
      ),
      radius: toFiniteNumber(
        controls[`${slot.prefix}Radius`],
        slot.spherical.radius
      ),
    });
  }

  return toVectorTuple(controls[`${slot.prefix}Position`], slot.position);
}

function resolveSlotShadow(slot, controls) {
  if (!slot.shadow) {
    return null;
  }

  if (controls[`${slot.prefix}CastShadow`] === false) {
    return null;
  }

  return {
    bias: toFiniteNumber(
      controls[`${slot.prefix}ShadowBias`],
      slot.shadow.bias
    ),
    extent: toFiniteNumber(
      controls[`${slot.prefix}ShadowExtent`],
      slot.shadow.extent
    ),
    far: toFiniteNumber(controls[`${slot.prefix}ShadowFar`], slot.shadow.far),
    intensity: slot.shadow.intensity,
    mapSize: toFiniteNumber(
      controls[`${slot.prefix}ShadowMapSize`],
      slot.shadow.mapSize
    ),
    near: slot.shadow.near,
    normalBias: toFiniteNumber(
      controls[`${slot.prefix}ShadowNormalBias`],
      slot.shadow.normalBias
    ),
    radius: slot.shadow.radius,
  };
}

function buildSlotRuntimeConfig(slot, controls) {
  return {
    ...slot,
    angle: toFiniteNumber(controls[`${slot.prefix}Angle`], slot.angle),
    color: controls[`${slot.prefix}Color`] ?? slot.color,
    debug: controls[`${slot.prefix}Debug`] ?? slot.debug,
    decay: toFiniteNumber(controls[`${slot.prefix}Decay`], slot.decay),
    distance: toFiniteNumber(controls[`${slot.prefix}Distance`], slot.distance),
    enabled: controls[`${slot.prefix}Enabled`] ?? slot.enabled,
    groundColor: controls[`${slot.prefix}GroundColor`] ?? slot.groundColor,
    height: toFiniteNumber(controls[`${slot.prefix}Height`], slot.height),
    intensity: toFiniteNumber(
      controls[`${slot.prefix}Intensity`],
      slot.intensity
    ),
    penumbra: toFiniteNumber(controls[`${slot.prefix}Penumbra`], slot.penumbra),
    position: resolveSlotPosition(slot, controls),
    ...(slot.rotation
      ? {
          rotation: toVectorTuple(
            controls[`${slot.prefix}Rotation`],
            slot.rotation
          ),
        }
      : {}),
    shadow: resolveSlotShadow(slot, controls),
    skyColor: controls[`${slot.prefix}SkyColor`] ?? slot.skyColor,
    ...(slot.target
      ? { target: toVectorTuple(controls[`${slot.prefix}Target`], slot.target) }
      : {}),
    width: toFiniteNumber(controls[`${slot.prefix}Width`], slot.width),
  };
}

export function buildSceneLightingRuntimeConfig({
  lighting,
  controls = {},
} = {}) {
  const normalized = normalizeSceneLightingDeclaration(lighting);

  return {
    enabled: controls.lightEnabled ?? normalized.enabled,
    slots: normalized.slots.map((slot) =>
      buildSlotRuntimeConfig(slot, controls)
    ),
  };
}
