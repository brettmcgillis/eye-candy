import {
  boundRadius as apollianBoundRadius,
  sceneDefaults as apollianDefaults,
  createField as createApollianField,
} from '@modules/apollian';

import { DEG, PHI, clamp, mod, rot2 } from './math';
import { exhibitOf } from './renderOptions.mjs';

// Every field exhibit is a solid `s < 0` inside the unit ball of object
// space, in object units. Each core is mirrored line for line by its TSL
// twin in @modules/exhibitARender (fields.js): change both together.

const MIN_R = 1e-8;
const ESCAPE = 2;
const { SQRT2 } = Math;

const box = (x, y, z, h) => {
  const qx = Math.abs(x) - h;
  const qy = Math.abs(y) - h;
  const qz = Math.abs(z) - h;
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0));
  return outside + Math.min(Math.max(qx, qy, qz), 0);
};

// Object space is y-up; the bulb's axis of symmetry is its z.
function mandelbulb(c) {
  const n = c.bulbPower;
  const phase = c.bulbPhase * DEG;
  return ([px, py, pz]) => {
    const cx = px;
    const cy = pz;
    const cz = py;
    let [x, y, z] = [cx, cy, cz];
    let dr = 1;
    let r = Math.hypot(x, y, z);
    let trap = 1e9;
    for (let i = 0; i < c.bulbIterations; i += 1) {
      r = Math.max(Math.hypot(x, y, z), MIN_R);
      if (r > ESCAPE) break;
      trap = Math.min(trap, r);
      const theta = Math.acos(clamp(z / r, -1, 1)) * n + phase;
      const phi = Math.atan2(y, x) * n;
      dr = r ** (n - 1) * n * dr + 1;
      const zr = r ** n;
      x = zr * Math.sin(theta) * Math.cos(phi) + cx;
      y = zr * Math.sin(theta) * Math.sin(phi) + cy;
      z = zr * Math.cos(theta) + cz;
    }
    r = Math.max(Math.hypot(x, y, z), MIN_R);
    return { d: (0.5 * Math.log(r) * r) / dr, trap: clamp(trap, 0, 1) };
  };
}

// Quilez's quaternion Julia distance: |dz| tracked as a scalar.
function quatJulia(c) {
  const C = [c.juliaCX, c.juliaCY, c.juliaCZ, c.juliaCW];
  return ([px, py, pz]) => {
    let z = [px, py, pz, c.juliaSlice];
    let mz2 = z[0] ** 2 + z[1] ** 2 + z[2] ** 2 + z[3] ** 2;
    let md2 = 1;
    let trap = 1e9;
    for (let i = 0; i < c.juliaIterations; i += 1) {
      md2 *= 4 * mz2;
      const [a, b, cc, d] = z;
      z = [
        a * a - b * b - cc * cc - d * d + C[0],
        2 * a * b + C[1],
        2 * a * cc + C[2],
        2 * a * d + C[3],
      ];
      trap = Math.min(trap, mz2);
      mz2 = z[0] ** 2 + z[1] ** 2 + z[2] ** 2 + z[3] ** 2;
      if (mz2 > 16) break;
    }
    mz2 = Math.max(mz2, MIN_R);
    return {
      d: 0.25 * Math.sqrt(mz2 / md2) * Math.log(mz2),
      trap: clamp(Math.sqrt(trap), 0, 1),
    };
  };
}

function mandelbox(c) {
  const s = c.boxScale;
  const fold = c.boxFold;
  const mr2 = c.boxMinRadius ** 2;
  return ([px, py, pz]) => {
    let [x, y, z] = [px, py, pz];
    let dr = 1;
    let trap = 1e9;
    for (let i = 0; i < c.boxIterations; i += 1) {
      x = clamp(x, -fold, fold) * 2 - x;
      y = clamp(y, -fold, fold) * 2 - y;
      z = clamp(z, -fold, fold) * 2 - z;
      const r2 = x * x + y * y + z * z;
      trap = Math.min(trap, r2);
      let k = 1;
      if (r2 < mr2) k = 1 / mr2;
      else if (r2 < 1) k = 1 / r2;
      x = x * k * s + px;
      y = y * k * s + py;
      z = z * k * s + pz;
      dr = dr * k * Math.abs(s) + 1;
    }
    // Rrrola's signed form: the bare |z|/|dr| never goes below zero.
    return {
      d:
        (Math.hypot(x, y, z) - Math.abs(s - 1)) / Math.abs(dr) -
        Math.abs(s) ** (1 - c.boxIterations),
      trap: clamp(Math.sqrt(trap), 0, 1),
    };
  };
}

// Quilez's Menger sponge, each level turned about y against the last.
function menger(c) {
  const twist = c.mengerTwist * DEG;
  return ([px, py, pz]) => {
    let [x, z] = [px, pz];
    const y = py;
    let d = box(x, y, z, 1);
    let s = 1;
    let trap = 0;
    for (let m = 0; m < c.mengerLevel; m += 1) {
      [x, z] = rot2(x, z, twist);
      const ax = mod(x * s, 2) - 1;
      const ay = mod(y * s, 2) - 1;
      const az = mod(z * s, 2) - 1;
      s *= 3;
      const rx = Math.abs(1 - 3 * Math.abs(ax));
      const ry = Math.abs(1 - 3 * Math.abs(ay));
      const rz = Math.abs(1 - 3 * Math.abs(az));
      const da = Math.max(rx, ry);
      const db = Math.max(ry, rz);
      const dc = Math.max(rz, rx);
      const cut = (Math.min(da, db, dc) - 1) / s;
      if (cut > d) {
        d = cut;
        trap = (m + 1) / c.mengerLevel;
      }
    }
    return { d, trap };
  };
}

// Knighty's kaleidoscopic IFS with octahedral folds and a cube offset.
function kifs(c) {
  const s = c.kifsScale;
  const off = c.kifsOffset * (s - 1);
  const a = c.kifsAngleA * DEG;
  const b = c.kifsAngleB * DEG;
  return ([px, py, pz]) => {
    let [x, y, z] = [px, py, pz];
    let trap = 1e9;
    for (let i = 0; i < c.kifsIterations; i += 1) {
      x = Math.abs(x);
      y = Math.abs(y);
      z = Math.abs(z);
      if (x < y) [x, y] = [y, x];
      if (x < z) [x, z] = [z, x];
      if (y < z) [y, z] = [z, y];
      [y, z] = rot2(y, z, a);
      x = x * s - off;
      y = y * s - off;
      z = z * s - off;
      [x, y] = rot2(x, y, b);
      trap = Math.min(trap, x * x + y * y + z * z);
    }
    return {
      d: box(x, y, z, 1) * s ** -c.kifsIterations,
      trap: clamp(Math.sqrt(trap) / 4, 0, 1),
    };
  };
}

// Homogeneous polynomials, so the projective turn is one rotation of (x, w).
const POLYNOMIALS = {
  barth: () => (x, y, z, w) => {
    const p2 = PHI * PHI;
    const r = x * x + y * y + z * z - w * w;
    return (
      4 * (p2 * x * x - y * y) * (p2 * y * y - z * z) * (p2 * z * z - x * x) -
      (1 + 2 * PHI) * r * r * w * w
    );
  },
  clebsch: () => (x, y, z, w) => {
    const sum = x + y + z + w;
    return x ** 3 + y ** 3 + z ** 3 + w ** 3 - sum ** 3;
  },
  kummer: (c) => {
    const mu2 = c.kummerMu ** 2;
    const lambda = (3 * mu2 - 1) / (3 - mu2);
    return (x, y, z, w) => {
      const r = x * x + y * y + z * z - mu2 * w * w;
      const p = w - z - SQRT2 * x;
      const q = w - z + SQRT2 * x;
      const s = w + z + SQRT2 * y;
      const t = w + z - SQRT2 * y;
      return r * r - lambda * p * q * s * t;
    };
  },
};

const TETRA = [
  [1, -1, -1],
  [-1, -1, 1],
  [-1, 1, -1],
  [1, 1, 1],
];
const GRAD_STEP = 1e-3;

// Which side `solid` keeps: the one that reads as an object in the ball.
const ORIENTATION = { barth: -1, clebsch: -1, kummer: 1 };

function algebraic(c, id) {
  const f = POLYNOMIALS[id](c);
  const turn = c.algebraicTurn * DEG;
  const [ct, st] = [Math.cos(turn), Math.sin(turn)];
  const evaluate = (x, y, z) => f(ct * x - st, y, z, st * x + ct);
  const sign = ORIENTATION[id] * (c.algebraicSide === 'inverse' ? -1 : 1);
  return ([px, py, pz]) => {
    const value = evaluate(px, py, pz);
    const g = [0, 0, 0];
    TETRA.forEach(([kx, ky, kz]) => {
      const v = evaluate(
        px + kx * GRAD_STEP,
        py + ky * GRAD_STEP,
        pz + kz * GRAD_STEP
      );
      g[0] += kx * v;
      g[1] += ky * v;
      g[2] += kz * v;
    });
    const grad = Math.max(Math.hypot(...g) / (4 * GRAD_STEP), MIN_R);
    const d = (value / grad) * sign;
    return {
      d: c.algebraicSide === 'shell' ? Math.abs(d) : d,
      trap: clamp(Math.log(grad + 1) / 6, 0, 1),
    };
  };
}

// Field units per object unit, and how the core is read: `swap` cores take
// y-up points, `shell` thickens a bare surface by `wall`.
export const FIELD_EXHIBITS = {
  barth: { core: (c) => algebraic(c, 'barth'), radius: (c) => c.barthExtent },
  clebsch: {
    core: (c) => algebraic(c, 'clebsch'),
    radius: (c) => c.clebschExtent,
  },
  kifs: { core: kifs, radius: (c) => (c.kifsOffset * 1.75) / c.fractalZoom },
  kummer: {
    core: (c) => algebraic(c, 'kummer'),
    radius: (c) => c.kummerExtent,
  },
  mandelbox: {
    core: mandelbox,
    radius: (c) =>
      (c.boxScale > 1
        ? (2 * Math.sqrt(3) * (c.boxScale + 1)) / (c.boxScale - 1)
        : 3.3) / c.fractalZoom,
  },
  mandelbulb: { core: mandelbulb, radius: (c) => 1.1 / c.fractalZoom },
  menger: { core: menger, radius: (c) => Math.sqrt(3) / c.fractalZoom },
  quatJulia: { core: quatJulia, radius: (c) => 1.25 / c.fractalZoom },
};

export const isGuest = (id) => id === 'apollian4' || id === 'kleinian';

// The flat Apollian config a guest exhibit is drawn with, so @modules/apollian
// and @modules/apollianRender stay the only home of those two fields.
export function guestConfig(config) {
  const id = exhibitOf(config);
  const klein = id === 'kleinian';
  return {
    ...apollianDefaults(),
    a4Folds: config.a4Folds,
    a4RotXW: config.a4RotXW,
    a4RotYW: config.a4RotYW,
    a4RotZW: config.a4RotZW,
    a4Scale: config.a4Scale,
    a4Shape: config.a4Shape,
    a4Twist: config.a4Twist,
    a4W: config.a4W,
    bound: config.guestBound,
    cubeHalf: config.guestCubeHalf,
    discHalf: config.guestDiscHalf,
    family: id,
    fieldScale: klein ? config.kleinFieldScale : config.a4FieldScale,
    fieldX: 0,
    fieldY: 0,
    fieldZ: 0,
    kleinFolds: config.kleinFolds,
    kleinKey: config.kleinKey,
    sectionCut: false,
    thickness: klein ? config.kleinThickness : config.a4Thickness,
  };
}

// The radius of the ball (or guest bound) the solid fits inside, in object
// units.
export function fieldRadius(config) {
  const id = exhibitOf(config);
  return isGuest(id) ? apollianBoundRadius(guestConfig(config)) : 1;
}

// `sample(p)` → { s, trap } with `s < 0` inside, in object units.
export default function createExhibitField(config) {
  const id = exhibitOf(config);
  if (isGuest(id)) {
    const field = createApollianField(guestConfig(config));
    return {
      distance: field.distance,
      sample: (p) => {
        const { s, trap } = field.sample(p);
        return { s, trap };
      },
    };
  }
  const def = FIELD_EXHIBITS[id];
  const core = def.core(config);
  const radius = def.radius(config);
  const shell =
    config.family === 'algebraic' && config.algebraicSide === 'shell'
      ? config.algebraicWall / 2
      : 0;
  const sample = (p) => {
    const { d, trap } = core([p[0] * radius, p[1] * radius, p[2] * radius]);
    const s = Math.max(d / radius - shell, Math.hypot(...p) - 1);
    return { s, trap };
  };
  return { distance: (p) => sample(p).s, sample };
}
