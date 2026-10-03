import kleinianParams from './kleinianKeys';
import { DEG, clamp, directionOf, fract, mod } from './math';
import buildPacking, { buildSphereGrid, packingDistance } from './packing';

export const OPEN_RADIUS = 2.5;
export const BOUNDS_EXTENT_CUBE = 0.75;
export const PACKING_GRID = 16;
const MIN_RADIUS_SQ = 1e-12;

// The radius every bound fits inside, in object units.
export function boundRadius(config) {
  if (config.bound === 'open') return OPEN_RADIUS;
  if (config.bound === 'cube') {
    return Math.hypot(BOUNDS_EXTENT_CUBE, config.cubeHalf, BOUNDS_EXTENT_CUBE);
  }
  if (config.bound === 'disc') return Math.hypot(1, config.discHalf);
  return 1;
}

export function boundDistance(config, p) {
  const [x, y, z] = p;
  switch (config.bound) {
    case 'disc':
      return Math.max(Math.abs(y) - config.discHalf, Math.hypot(x, z) - 1);
    case 'cube': {
      const q = [
        Math.abs(x) - BOUNDS_EXTENT_CUBE,
        Math.abs(y) - config.cubeHalf,
        Math.abs(z) - BOUNDS_EXTENT_CUBE,
      ];
      const outside = Math.hypot(...q.map((v) => Math.max(v, 0)));
      return outside + Math.min(Math.max(...q), 0);
    }
    case 'open':
      return Math.hypot(x, y, z) - OPEN_RADIUS;
    default:
      return Math.hypot(x, y, z) - 1;
  }
}

const rot = (a, b, angle) => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [c * a + s * b, -s * a + c * b];
};

// mrange's 4D apollian, sliced by lifting to w and turning the xw/yw/zw
// planes. `tubes` is "Slicing a 4D apollian" (distance to two 2-planes, so
// curves in 3D); `sheets` is "Apollian with a twist" (|p.y|, a 3-plane, so
// surfaces in 3D and gasket curves in a slice). Twist bends w with radius as
// the twist shader does: w = a4W (1 - twist tanh(4|q|)).
function apollian4(config) {
  const s = config.a4Scale;
  const folds = config.a4Folds;
  const sheets = config.a4Shape === 'sheets';
  const twist = config.a4Twist;
  const angles = [config.a4RotXW, config.a4RotYW, config.a4RotZW].map(
    (a) => a * DEG
  );
  return ([x, y, z]) => {
    const w = config.a4W * (1 - twist * Math.tanh(4 * Math.hypot(x, y, z)));
    const p = [x, y, z, w];
    [p[0], p[3]] = rot(p[0], p[3], angles[0]);
    [p[1], p[3]] = rot(p[1], p[3], angles[1]);
    [p[2], p[3]] = rot(p[2], p[3], angles[2]);
    let scale = 1;
    let trap = 1e9;
    for (let i = 0; i < folds; i += 1) {
      for (let a = 0; a < 4; a += 1) p[a] = fract(p[a] * 0.5 + 0.5) * 2 - 1;
      const r2 = Math.max(
        p[0] ** 2 + p[1] ** 2 + p[2] ** 2 + p[3] ** 2,
        MIN_RADIUS_SQ
      );
      trap = Math.min(trap, r2);
      const k = s / r2;
      for (let a = 0; a < 4; a += 1) p[a] *= k;
      scale *= k;
    }
    if (sheets) return { d: Math.abs(p[1]) / scale, scale, trap };
    const ap = p.map((v) => Math.abs(v) / scale);
    const d =
      Math.min(Math.hypot(ap[1], ap[3]), Math.hypot(ap[0], ap[2])) * 0.55;
    return { d, scale, trap };
  };
}

// Reference 3's slab: a homogeneous mod fold with a constant inversion.
function disc(config) {
  const s = config.discScale;
  const folds = config.discFolds;
  return ([x, y, z]) => {
    const p = [x * 0.5, y * 0.5 + config.discDrift, z * 0.5, 1];
    let trap = 1e9;
    for (let i = 0; i < folds; i += 1) {
      for (let a = 0; a < 3; a += 1) p[a] = mod(p[a] - 1, 2) - 1;
      const r2 = Math.max(p[0] ** 2 + p[1] ** 2 + p[2] ** 2, MIN_RADIUS_SQ);
      trap = Math.min(trap, r2);
      const k = s / r2;
      for (let a = 0; a < 4; a += 1) p[a] *= k;
    }
    return { d: Math.abs(p[1] / p[3]) * 0.5, scale: p[3], trap };
  };
}

// knighty's pseudo-kleinian as Durand keyframes it.
function kleinian(config) {
  const { maxs, mins } = kleinianParams(config.kleinKey);
  const folds = config.kleinFolds;
  return ([x, y, z]) => {
    const p = [x, y, z];
    let scale = 1;
    let trap = 1e9;
    for (let i = 0; i < folds; i += 1) {
      for (let a = 0; a < 3; a += 1) {
        p[a] = 2 * clamp(p[a], mins[a], maxs[a]) - p[a];
      }
      const r2 = Math.max(p[0] ** 2 + p[1] ** 2 + p[2] ** 2, MIN_RADIUS_SQ);
      trap = Math.min(trap, r2);
      const k = Math.max(mins[3] / r2, 1);
      p[0] *= k;
      p[1] *= k;
      p[2] *= k;
      scale *= k;
    }
    const rxy = Math.hypot(p[0], p[1]);
    const d =
      (0.7 * Math.max(rxy - maxs[3], (rxy * p[2]) / Math.hypot(...p))) / scale;
    return { d, scale, trap };
  };
}

const CORES = { apollian4, disc, kleinian };

const packingCache = { key: null, value: null };
const PACKING_KEYS = [
  'classicMinRadius',
  'classicMaxSpheres',
  'classicWarp',
  'classicWarpAzimuth',
  'classicWarpElevation',
];

export function packingFor(config) {
  const key = PACKING_KEYS.map((k) => config[k]).join('|');
  if (packingCache.key !== key) {
    const spheres = buildPacking(config);
    packingCache.key = key;
    packingCache.value = {
      grid: buildSphereGrid(spheres, { gap: 0, resolution: PACKING_GRID }),
      spheres,
    };
  }
  return packingCache.value;
}

// Depth reads the fold's accumulated inversion scale: big structures sit at
// 0, the finest the folds resolve at 1.
export const depthOf = (scale, folds) =>
  clamp(Math.log2(Math.max(scale, 1)) / (folds * 2), 0, 1);

// The object's solid is `s < 0`: the family's field (or the packing) less
// `thickness`, intersected with the bound and, if asked, the section cut.
// `withCut: false` is how a slice reads the solid on its own plane.
export default function createField(config, { withCut = true } = {}) {
  const cutNormal = directionOf(config.sliceAzimuth, config.sliceElevation);
  const cut = withCut && config.sectionCut;
  const finish = (s, p) => {
    let out = Math.max(s, boundDistance(config, p));
    if (cut) {
      const plane =
        cutNormal[0] * p[0] +
        cutNormal[1] * p[1] +
        cutNormal[2] * p[2] -
        config.sliceOffset;
      out = Math.max(out, plane);
    }
    return out;
  };

  if (config.family === 'classic') {
    const { grid, spheres } = packingFor(config);
    const gap = config.classicGap;
    const sample = (p) => {
      const { d, sphere } = packingDistance(spheres, grid, gap, p);
      const generation = sphere >= 0 ? spheres[sphere * 5 + 4] : 0;
      const radius = sphere >= 0 ? spheres[sphere * 5 + 3] : 1;
      return {
        depth: clamp(Math.log2(1 / radius) / 7, 0, 1),
        s: finish(d, p),
        trap: clamp(generation / 8, 0, 1),
      };
    };
    return { distance: (p) => sample(p).s, sample };
  }

  const core = CORES[config.family](config);
  const folds = {
    apollian4: config.a4Folds,
    disc: config.discFolds,
    kleinian: config.kleinFolds,
  }[config.family];
  const { fieldScale, thickness } = config;
  const offset = [config.fieldX, config.fieldY, config.fieldZ];
  const sample = (p) => {
    const q = [
      p[0] * fieldScale + offset[0],
      p[1] * fieldScale + offset[1],
      p[2] * fieldScale + offset[2],
    ];
    const { d, scale, trap } = core(q);
    return {
      depth: depthOf(scale, folds),
      s: finish(d / fieldScale - thickness, p),
      trap: clamp(Math.sqrt(trap), 0, 1),
    };
  };
  return { distance: (p) => sample(p).s, sample };
}
