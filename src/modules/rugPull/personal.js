// The house motifs: the loader's argyle, the Reversal knot and the Turboflex
// skull, woven like any other motif — `(x, y, k) => role | -1` over about
// [-1, 1] on the long side.
import { SQUARES_H, SQUARES_V } from '@utils/argylePattern';

import BITMAPS from './bitmaps';
import { R } from './palettes';
import { box, ellipse, lobes, rhombus } from './sdf';

export const MINE = ['argyle', 'reversal', 'turboflex'];

// The H argyle spans 4√2 by 2.5√2 grid units; one unit squares to a diamond.
const ARGYLE_HALF = 2 * Math.SQRT2;

function argyleSdf(squares, layer, sx, sy) {
  let d = Infinity;
  for (let i = 0; i < squares.length; i += 1) {
    const sq = squares[i];
    if (sq.layer === layer) {
      d = Math.min(d, box(sx - sq.sx, sy - sq.sy, 0.5, 0.5));
    }
  }
  return d;
}

export function argyle({ c, vertical = false, halo = -1 }) {
  const squares = vertical ? SQUARES_V : SQUARES_H;
  return (x, y, k) => {
    const gx = x * ARGYLE_HALF;
    const gy = y * ARGYLE_HALF;
    const sx = (gx + gy) * Math.SQRT1_2;
    const sy = (gy - gx) * Math.SQRT1_2;
    const kk = k * ARGYLE_HALF;
    const top = argyleSdf(squares, 't', sx, sy);
    if (top < 0) return c.b;
    const bottom = argyleSdf(squares, 'b', sx, sy);
    if (bottom < 0) return c.a;
    if (halo >= 0 && Math.min(top, bottom) < kk * 1.1) return halo;
    return -1;
  };
}

function decode(map) {
  const cells = new Uint8Array(map.w * map.h);
  map.rows.forEach((row, y) => {
    let x = 0;
    [...row.matchAll(/(\d*)(\D)/gu)].forEach(([, count, char]) => {
      const n = count ? Number(count) : 1;
      cells.fill(char.charCodeAt(0), y * map.w + x, y * map.w + x + n);
      x += n;
    });
  });
  return { cells, h: map.h, w: map.w };
}

const CHARTS = Object.fromEntries(
  Object.entries(BITMAPS).map(([name, map]) => [name, decode(map)])
);
const DOT = '.'.charCodeAt(0);
const INK = 'k'.charCodeAt(0);

// A charted picture sampled 3×3 across each knot's footprint; the contour
// class wins a tie so thin black lines survive a coarse weave.
function chartMotif(name, classRoles) {
  const { cells, h, w } = CHARTS[name];
  const aspect = h / w;
  const lookup = new Int16Array(128).fill(-1);
  Object.entries(classRoles).forEach(([char, role]) => {
    lookup[char.charCodeAt(0)] = role;
  });
  const counts = new Uint8Array(128);
  return (x, y, k) => {
    if (Math.abs(x) > 1 + k || Math.abs(y) > aspect + k) return -1;
    const px = (w / 2) * (x + 1);
    const py = (w / 2) * (y + aspect);
    const foot = (w / 2) * k;
    let best = DOT;
    let bestCount = 0;
    counts.fill(0);
    for (let j = -1; j <= 1; j += 1) {
      for (let i = -1; i <= 1; i += 1) {
        const sx = Math.floor(px + (i * foot) / 3);
        const sy = Math.floor(py + (j * foot) / 3);
        if (sx >= 0 && sy >= 0 && sx < w && sy < h) {
          const cell = cells[sy * w + sx];
          counts[cell] += 1;
          if (
            counts[cell] > bestCount ||
            (counts[cell] === bestCount && cell === INK)
          ) {
            best = cell;
            bestCount = counts[cell];
          }
        }
      }
    }
    if (best === DOT || bestCount < 3) return -1;
    return lookup[best];
  };
}

export function reversal({ c }) {
  return chartMotif('reversal', { R: c.a, k: c.b });
}

export function turboflex() {
  return chartMotif('turboflex', {
    c: R.camel,
    g: R.sky,
    k: R.dark,
    r: R.rose,
    w: R.ivory,
    y: R.gold,
  });
}

export const MINE_ASPECT = {
  argyle: 2.5 / 4,
  reversal: CHARTS.reversal.h / CHARTS.reversal.w,
  turboflex: CHARTS.turboflex.h / CHARTS.turboflex.w,
};

// A house motif's yarns. The argyle keeps the loader's red-over-black
// unless the ground is one of them; the Reversal its red ring and dark knot.
export function mineYarns(ink, ground) {
  const red = ground === R.red ? R.ivory : R.red;
  const dark = ground === R.dark ? R.ivory : R.dark;
  return {
    a: red,
    b: dark,
    c: ink.accent(ground, [red, dark]),
    ground,
    line: ink.lineOn(ground),
  };
}

export function mineMotif(name, yarns, { vertical = false } = {}) {
  if (name === 'reversal') return reversal({ c: yarns });
  if (name === 'turboflex') return turboflex();
  return argyle({ c: yarns, vertical });
}

// A frame the house motif sits in, so it reads as a medallion or cartouche
// woven into the rug rather than pasted on it.
export function mineMedallion({ name, c, inner, frame = 'lobed', tall = 1 }) {
  const motif = mineMotif(name, inner);
  const aspect = MINE_ASPECT[name];
  const fit = Math.min(0.78, (0.78 * tall) / aspect);
  return (x, y, k) => {
    const sy = y / tall;
    let d;
    if (frame === 'lozenge') d = rhombus(x, sy, 1, 1);
    else if (frame === 'oval') d = ellipse(x, sy, 1, 1);
    else {
      const r = Math.hypot(x, sy);
      d = r - 0.94 * lobes(Math.atan2(x, -sy), 14, 0.1, 0.5);
    }
    if (d >= 0) return -1;
    if (d > -k) return c.line;
    if (d > -0.1) return c.a;
    if (d > -0.1 - k) return c.line;
    const m = motif(x / fit, y / fit, k / fit);
    return m >= 0 ? m : inner.ground;
  };
}
