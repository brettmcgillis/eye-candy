import { hexToRgb, pickStop } from '@utils/paletteStops';

import { ROLES } from './renderOptions.mjs';

const toLinear = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
export const linearOf = (hex) => hexToRgb(hex).map(toLinear);

const ROLE_KEYS = {
  accent: 'roleAccent',
  dark: 'roleDark',
  emissive: 'roleEmissive',
  glass: 'roleGlass',
  light: 'roleLight',
};

// Roles take consecutive slices of the role die in a fixed order, so the rect
// reference (emissive < 0.1, accent < 0.2, dark) and the octree reference
// (dark < 0.4, light < 0.8, glass) are both just weights.
export function roleOf(config, roll) {
  const weights = ROLES.map((role) => Math.max(config[ROLE_KEYS[role]], 0));
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return 'dark';
  let edge = 0;
  for (let i = 0; i < ROLES.length; i += 1) {
    edge += weights[i] / total;
    if (roll < edge) return ROLES[i];
  }
  return ROLES[ROLES.length - 1];
}

const BLACK = [0, 0, 0];

// `mixed` reads the leaf's last die, which nothing else uses, so turning it
// on changes shapes and nothing else.
export function shapeOf(config, roll) {
  if (config.cellShape !== 'mixed') return config.cellShape;
  return roll < config.sphereShare ? 'sphere' : 'cube';
}

// Colours are linear, ready for the instance buffers. `family` says which
// mesh draws the cell: opaque solids and glass cannot blend into each other.
export function lookOf(config, leaf, stops) {
  if (!leaf || leaf.hole || leaf.rolls[0] >= config.density) return null;
  const [, roleRoll, vary, shapeRoll] = leaf.rolls;
  const role = roleOf(config, roleRoll);
  const shape = shapeOf(config, shapeRoll);

  if (role === 'glass') {
    return {
      core: linearOf(config.coreColor).map((c) => c * config.coreIntensity),
      family: 'glass',
      role,
      roughness: config.glassRoughness * vary,
      shape,
      tint: linearOf(config.glassColor),
    };
  }

  const emissive = role === 'emissive';
  let base = linearOf(config[`${role}Color`] ?? config.darkColor);
  if (!emissive && stops?.length && config.paletteMix > 0) {
    const stop = pickStop(stops, vary).map(toLinear);
    base = base.map((c, i) => c + (stop[i] - c) * config.paletteMix);
  }

  return {
    color: emissive ? [0.8, 0.8, 0.8] : base,
    emissive: emissive
      ? linearOf(config.emissiveColor).map((c) => c * config.emissiveIntensity)
      : BLACK,
    family: 'opaque',
    noise: role === 'dark' ? config.surfaceNoise : 0,
    role,
    roughness: emissive ? 0.1 : config[`${role}Roughness`],
    shape,
  };
}

const mix = (a, b, t) => a + (b - a) * t;
const mix3 = (a, b, t) => a.map((v, i) => mix(v, b[i], t));

function blendLooks(a, b, t) {
  if (a.family === 'glass') {
    return {
      ...b,
      core: mix3(a.core, b.core, t),
      roughness: mix(a.roughness, b.roughness, t),
      tint: mix3(a.tint, b.tint, t),
    };
  }
  return {
    ...b,
    color: mix3(a.color, b.color, t),
    emissive: mix3(a.emissive, b.emissive, t),
    noise: mix(a.noise, b.noise, t),
    roughness: mix(a.roughness, b.roughness, t),
  };
}

// What a morphing cell draws: one solid when both ends agree on the mesh,
// otherwise the outgoing look shrinks away while the incoming one grows.
export function cellSolids(lookA, lookB, t) {
  if (!lookA && !lookB) return [];
  if (!lookA) return [{ look: lookB, presence: t }];
  if (!lookB) return [{ look: lookA, presence: 1 - t }];
  if (lookA.family === lookB.family && lookA.shape === lookB.shape) {
    return [
      { look: t <= 0 ? lookA : blendLooks(lookA, lookB, t), presence: 1 },
    ];
  }
  return [
    { look: lookA, presence: 1 - t },
    { look: lookB, presence: t },
  ];
}
