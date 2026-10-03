// Borders and guards. A band motif draws one tile of a repeat:
// `(u, v, k, t, half) => role | -1`, u along the band in [-half, half], v
// across it from -1 (outer edge) to 1 (inner edge), both in half band
// widths; t is the tile's index from the side's middle, so a border mirrors
// end to end.
import {
  boteh,
  cloudband,
  diamondDot,
  hookedLozenge,
  leaf,
  palmette,
  place,
  rosette,
  smallStar,
  star8,
} from './motifs';
import { MINE_ASPECT, mineMotif } from './personal';
import { box, ellipse, rhombus } from './sdf';

const parity = (t) => Math.abs(Math.round(t)) % 2;
const tri = (u, half) => 1 - (2 * Math.abs(u)) / half;

// --- main borders -------------------------------------------------------------

function herati(c) {
  const rose = place(rosette({ c, petals: 8 }), 0, 0, 0.62);
  const palm = palmette({ c: { ...c, a: c.b, b: c.c, c: c.a } });
  const inward = place(palm, 0, 0, 0.6, 2);
  const outward = place(palm, 0, 0, 0.6, 0);
  const sprig = leaf({ c: { ...c, a: c.c }, width: 0.3 });
  return (u, v, k, t, half) => {
    let motif = rose;
    if (parity(t) === 1)
      motif = parity((Math.abs(t) - 1) / 2) ? outward : inward;
    const m = motif(u, v, k);
    if (m >= 0) return m;
    const phase = (Math.PI / 2) * (u / half) + Math.PI * t;
    const wave = 0.62 * Math.sin(phase);
    if (Math.abs(v - wave) < k * 0.7) return c.line;
    const lx = (Math.abs(u) - half * 0.5) / 0.24;
    return sprig(-(v - wave * 0.8 + 0.22) / 0.24, lx, k / 0.24);
  };
}

function rosettePalmette(c) {
  const rose = place(rosette({ c, petals: 8, pointed: true }), 0, 0, 0.7);
  const palm = palmette({ c: { ...c, a: c.b, b: c.a } });
  const up = place(palm, 0, 0, 0.72, 2);
  const down = place(palm, 0, 0, 0.72, 0);
  const dot = diamondDot({ c: { ...c, a: c.c } });
  return (u, v, k, t, half) => {
    const p = parity(t);
    let motif = rose;
    if (p === 1) motif = parity((Math.abs(t) - 1) / 2) ? down : up;
    const m = motif(u, v, k);
    if (m >= 0) return m;
    return dot((Math.abs(u) - half) / 0.18, v / 0.18, k / 0.18);
  };
}

function cartouche(c) {
  const cloud = cloudband({ c: { ...c, a: c.c } });
  const rose = rosette({ c: { ...c, a: c.b, b: c.c, c: c.a }, petals: 8 });
  return (u, v, k, t, half) => {
    const r = rose((Math.abs(u) - half) / 0.62, v / 0.62, k / 0.62);
    if (r >= 0) return r;
    const len = half * 0.66;
    const cart = Math.min(
      ellipse(u, v, len, 0.62),
      rhombus(u, v, len * 1.25, 0.32)
    );
    if (cart >= 0) return -1;
    if (cart > -k) return c.line;
    const inner = cloud(u / (len * 0.9), v / 0.55, k / (len * 0.9));
    return inner >= 0 ? inner : c.a;
  };
}

function kufic(c) {
  return (u, v, k, t, half) => {
    const s = half / 1;
    const x = u / s;
    const base = box(x, v + 0.62, 1.2, 0.12);
    const stem = box(x, v, 0.12, 0.62);
    const cap = box(x, v - 0.55, 0.42, 0.12);
    const hook = Math.min(
      box(Math.abs(x) - 0.62, v - 0.1, 0.11, 0.42),
      box(Math.abs(x) - 0.48, v - 0.45, 0.25, 0.1)
    );
    const d = Math.min(base, stem, cap, hook);
    if (d >= 0) return -1;
    return parity(t) ? c.a : c.b;
  };
}

function runningDog(c) {
  return (u, v, k, t, half) => {
    const x = u / half;
    const crest = Math.abs(Math.hypot(x - 0.25, v + 0.05) - 0.42) - 0.12;
    const cut = x - 0.25 > 0.05 && v + 0.05 > 0.1 ? 9 : crest;
    const stroke = Math.abs(v - 0.5 + (x + 1) * 0.55) - 0.14;
    const strokeCut = x < -1 || x > 0.1 ? 9 : stroke;
    const d = Math.min(cut, strokeCut);
    if (d >= 0) return -1;
    return d > -k ? c.line : c.a;
  };
}

function botehRow(c) {
  const b = boteh({ c });
  const left = place(b, 0, 0, 0.78, 1);
  const right = place(b, 0, 0, 0.78, 1, true);
  return (u, v, k, t) => (parity(t) ? right : left)(u, v, k);
}

function starRow(c) {
  const st = place(star8({ c }), 0, 0, 0.78);
  const dia = place(diamondDot({ c: { ...c, a: c.b } }), 0, 0, 0.6);
  return (u, v, k, t) => {
    const m = (parity(t) ? dia : st)(u, v, k);
    if (m >= 0) return m;
    return Math.abs(v) < k * 0.6 ? c.line : -1;
  };
}

function hookedDiamonds(c) {
  const loz = place(
    hookedLozenge({ c, tall: 1, hooks: 2, rings: 1 }),
    0,
    0,
    0.82
  );
  return (u, v, k) => {
    const m = loz(u, v, k);
    if (m >= 0) return m;
    return Math.abs(v) < k * 0.6 ? c.line : -1;
  };
}

// --- house borders --------------------------------------------------------

function mineChain(name, c) {
  const aspect = MINE_ASPECT[name];
  const s = Math.min(1.3, 0.86 / aspect);
  const even = place(mineMotif(name, c), 0, 0, s);
  const odd = place(mineMotif(name, { ...c, a: c.b, b: c.a }), 0, 0, s);
  return {
    motif: (u, v, k, t) => {
      const m = (name === 'argyle' && parity(t) ? odd : even)(u, v, k);
      if (m >= 0) return m;
      return Math.abs(v) < k * 0.6 ? c.line : -1;
    },
    ratio: s * 1.15,
  };
}

function argyleLattice(c) {
  return (u, v, k, t, half) => {
    const d = rhombus(u, v, half, 1);
    const over = Math.min(
      Math.abs(u / half + v) - k * 0.4,
      Math.abs(u / half - v) - k * 0.4
    );
    if (d < 0) {
      if (over < 0 && Math.abs(v) < 0.95) return c.line;
      return parity(t) ? c.b : c.a;
    }
    return -1;
  };
}

// --- guards: narrow, so coarse --------------------------------------------

function dots(c) {
  return (u, v, k, t) => {
    const d = Math.hypot(u, v) - 0.55;
    if (d >= 0) return -1;
    return parity(t) ? c.b : c.a;
  };
}

function reciprocal(c) {
  return (u, v, k, t, half) => (v < 0.8 * tri(u, half) - 0.1 ? c.a : c.b);
}

function barber(c) {
  return (u, v, k, t, half) =>
    ((((u + v * half) / (half * 2)) % 1) + 1) % 1 < 0.5 ? c.a : c.b;
}

function zigzag(c) {
  return (u, v, k, t, half) =>
    Math.abs(v - 0.7 * tri(u, half) + 0.35) < 0.42 ? c.a : -1;
}

function chain(c) {
  return (u, v, k, t, half) => {
    const d = rhombus(u, v, half * 0.98, 0.95);
    if (d >= 0) return -1;
    if (d > -k * 1.2) return c.a;
    return Math.hypot(u, v) < 0.35 ? c.b : -1;
  };
}

function tinyRosettes(c) {
  const st = smallStar({ c, points: 8 });
  const st2 = smallStar({ c: { ...c, a: c.b }, points: 8 });
  return (u, v, k, t) => (parity(t) ? st2 : st)(u / 0.85, v / 0.85, k / 0.85);
}

function argyleRow(c) {
  return (u, v, k, t, half) => {
    const d = rhombus(u, v, half, 0.95);
    if (d >= 0) return -1;
    return parity(t) ? c.b : c.a;
  };
}

function plain() {
  return () => -1;
}

// `ratio` is the nominal tile length over the band width.
export const BORDERS = {
  herati: { make: herati, ratio: 1.4 },
  rosettePalmette: { make: rosettePalmette, ratio: 0.9 },
  cartouche: { make: cartouche, ratio: 2.2 },
  kufic: { make: kufic, ratio: 0.85 },
  runningDog: { make: runningDog, ratio: 0.8 },
  botehRow: { make: botehRow, ratio: 1.1 },
  starRow: { make: starRow, ratio: 1 },
  hookedDiamonds: { make: hookedDiamonds, ratio: 0.95 },
  argyleLattice: { make: argyleLattice, mine: true, ratio: 0.75 },
  argyleChain: { chain: 'argyle', mine: true },
  reversalChain: { chain: 'reversal', mine: true },
  turboflexChain: { chain: 'turboflex', mine: true },
};

export const GUARDS = {
  plain: { make: plain, ratio: 1 },
  dots: { make: dots, ratio: 1 },
  reciprocal: { make: reciprocal, ratio: 0.75 },
  barber: { make: barber, ratio: 0.7 },
  zigzag: { make: zigzag, ratio: 0.8 },
  chain: { make: chain, ratio: 0.9 },
  rosettes: { make: tinyRosettes, ratio: 1 },
  argyleRow: { make: argyleRow, mine: true, ratio: 0.8 },
};

export const BORDER_IDS = Object.keys(BORDERS);
export const GUARD_IDS = Object.keys(GUARDS);
export const TRADITIONAL_BORDERS = BORDER_IDS.filter((id) => !BORDERS[id].mine);
export const TRADITIONAL_GUARDS = GUARD_IDS.filter((id) => !GUARDS[id].mine);

export function bandMotif(table, id, yarns) {
  const entry = table[id];
  if (entry.chain) return mineChain(entry.chain, yarns);
  return { motif: entry.make(yarns), ratio: entry.ratio };
}

// Paints one band between depths d0 and d1 (knots in from `rect`'s edge).
// With `corners`, each corner square holds `corner` instead of a mitre.
export function paintBand(canvas, rect, band) {
  const { corner, d0, d1, ground, motif, ratio } = band;
  const w = d1 - d0;
  const half = w / 2;
  const k = 1 / half;
  const spanX = rect.x1 - rect.x0;
  const spanY = rect.y1 - rect.y0;
  const lengthOf = (span) =>
    (corner ? span - 2 * d1 : span - 2 * (d0 + half)) / half;
  const fit = (length) => {
    let n = Math.max(1, Math.round(length / (ratio * 2)));
    if (n % 2 === 0) n += length / n > ratio * 2 ? 1 : -1;
    n = Math.max(1, n);
    return { length, n, tile: length / n };
  };
  const along = { x: fit(lengthOf(spanX)), y: fit(lengthOf(spanY)) };
  const cx = (rect.x0 + rect.x1) / 2;
  const cy = (rect.y0 + rect.y1) / 2;

  canvas.paint(rect.x0, rect.y0, rect.x1, rect.y1, (px, py) => {
    const dx = Math.min(px - rect.x0, rect.x1 - px);
    const dy = Math.min(py - rect.y0, rect.y1 - py);
    const dist = Math.min(dx, dy);
    if (dist < d0 || dist >= d1) return -1;
    if (corner && dx < d1 && dy < d1) {
      const role = corner((dx - d0 - half) / half, (dy - d0 - half) / half, k);
      return role >= 0 ? role : ground;
    }
    const horizontal = corner ? dy < d1 && dx >= d1 : dy <= dx;
    const fitted = horizontal ? along.x : along.y;
    const offset = (horizontal ? px - cx : py - cy) / half + fitted.length / 2;
    const index = Math.floor(offset / fitted.tile);
    const u = offset - (index + 0.5) * fitted.tile;
    const t = index - (fitted.n - 1) / 2;
    const v = ((horizontal ? dy : dx) - d0) / half - 1;
    const role = motif(u, v, k, t, fitted.tile / 2);
    return role >= 0 ? role : ground;
  });
}
