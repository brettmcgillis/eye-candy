/* eslint-disable no-bitwise */
import {
  Fn,
  float,
  int,
  select,
  time,
  uint,
  uniform,
  uniformArray,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  LOOK_DEFAULTS,
  cellCoords,
  charSeed,
  colorUniform,
  hash2,
} from './shared';

// The bitwise "script" generator from plans/font.md. It writes in horizontal
// bands of ink (one band every s4[0] * s4[3] rows); a glyph is a window cut
// out of a band, stored as its origin { x, y } in the pattern's integer
// space. Rows count up from the bottom, as the source's y does.
export const S4_OPTIONS = [
  [7, 0, 7, 7],
  [7, 3, 3, 3],
  [5, 3, 3, 3],
  [7, 6, 5, 5],
  [7, 3, 7, 5],
  [5, 0, 7, 7],
  [5, 0, 5, 13],
  [3, 5, 9, 11],
];

export const SCRIPT_OPTIONS = [
  [2, 7, 3, 5],
  [3, 5, 3, 5],
  [2, 11, 3, 5],
  [5, 7, 3, 5],
];

export const defaults = {
  ...LOOK_DEFAULTS,
  bandY: 35,
  cellH: 7,
  cellW: 8,
  cursive: true,
  gapX: 1,
  gapY: 0,
  s4: S4_OPTIONS[0],
  salt: 0,
  script: SCRIPT_OPTIONS[0],
  scroll: 0,
};

export const generatorKeys = [
  'salt',
  's4',
  'script',
  'cursive',
  'cellW',
  'cellH',
  'bandY',
];

const div = (a, b) => Math.trunc(a / b);

// `#define L(I) ((I^(I).y) & (I^(I).y)%s4.z ^ I).x` — `%` and `&` bind
// tighter than `^`, so this is (a & (a % z)) ^ I.x with a = I.x ^ I.y.
const L = (x, y, z) => {
  const a = x ^ y;
  return (a & (a % z)) ^ x;
};

export function inkAt(x, y, params) {
  const [sx, sy, sz, sw] = params.s4;
  const [cx, cy, cz, cw] = params.script;
  const jx = (div(x, sx) % sw) + sy;
  const jy = (div(y, sx) % sw) + sy;
  const kx = params.cursive ? jx : jy;
  const ky = params.cursive ? jy : jx;

  const t1 = L(x & div(x, cx), y & div(y, cx), sz);
  const t2 = L(x & div(x, cy), y & div(y, cy), sz);
  const t3 = L(kx & div(jx, cz), ky & div(jy, cz), sz);
  const t4 = L(jx & div(jx, cw), jy & div(jy, cw), sz);
  return ((t1 | t2) & t3 & t4) !== 0;
}

const SCAN_WIDTH = 512;

export function findBands(params, maxRows = 512) {
  const bands = [];
  let start = -1;
  for (let y = 0; y <= maxRows; y += 1) {
    let inked = false;
    for (let x = 0; x < SCAN_WIDTH && !inked && y < maxRows; x += 1) {
      inked = inkAt(x, y, params);
    }
    if (inked && start < 0) start = y;
    if (!inked && start >= 0) {
      bands.push({ height: y - start, y: start });
      start = -1;
    }
  }
  return bands;
}

// Hand edits are pixels toggled against the pattern, stored as [row, col]
// inside the glyph window, so moving the window keeps them in place.
export function glyphBits(glyph, params) {
  const flipped = new Set(
    (glyph?.flips ?? []).map(([row, col]) => `${row},${col}`)
  );
  const bits = [];
  for (let row = 0; row < params.cellH; row += 1) {
    const line = [];
    for (let col = 0; col < params.cellW; col += 1) {
      const base = glyph ? inkAt(glyph.x + col, glyph.y + row, params) : false;
      line.push(flipped.has(`${row},${col}`) ? !base : base);
    }
    bits.push(line);
  }
  return bits;
}

export function toggleFlip(glyph, row, col) {
  const flips = glyph.flips ?? [];
  const exists = flips.some(([r, c]) => r === row && c === col);
  return {
    ...glyph,
    flips: exists
      ? flips.filter(([r, c]) => r !== row || c !== col)
      : [...flips, [row, col]],
  };
}

// Flip bits packed 24 to a float (exact in float32), four floats to a vec4.
const BITS_PER_WORD = 24;
const FLIP_WORDS = 16;
export const MAX_GLYPH_PIXELS = BITS_PER_WORD * FLIP_WORDS;

function packFlips(glyph, params) {
  const words = new Array(FLIP_WORDS).fill(0);
  (glyph?.flips ?? []).forEach(([row, col]) => {
    if (row >= params.cellH || col >= params.cellW) return;
    const index = row * params.cellW + col;
    if (index >= MAX_GLYPH_PIXELS) return;
    words[Math.floor(index / BITS_PER_WORD)] ^= 1 << (index % BITS_PER_WORD);
  });
  return words;
}

function density(bits) {
  const flat = bits.flat();
  return flat.filter(Boolean).length / Math.max(1, flat.length);
}

const X_RANGE = 8192;

export function generateGlyph(char, params, reroll = 0, used = new Set()) {
  const [sx, sy] = charSeed(char, params.salt + reroll * 7.77);
  const start = Math.floor(hash2(sx, sy)[0] * X_RANGE);
  let fallback = null;

  for (let step = 0; step < 512; step += 1) {
    const glyph = { x: start + step * 3, y: params.bandY };
    const bits = glyphBits(glyph, params);
    const key = bits.map((line) => line.map(Number).join('')).join('/');
    const value = density(bits);
    if (!fallback && value > 0) fallback = glyph;
    if (value >= 0.25 && value <= 0.75 && !used.has(key)) {
      used.add(key);
      return glyph;
    }
  }

  return fallback ?? { x: start, y: params.bandY };
}

// Snaps the band to one that actually has ink under the current pattern
// parameters, keeping the requested one when it does.
export function resolveParams(params) {
  const bands = findBands(params);
  if (!bands.length) return { params, bands };
  const current = bands.find((band) => band.y === params.bandY);
  if (current) return { params, bands };
  const tallest = bands
    .slice(0, 6)
    .reduce((best, band) => (band.height > best.height ? band : best));
  return {
    bands,
    params: { ...params, bandY: tallest.y, cellH: tallest.height },
  };
}

export function generateGlyphs(charset, inputParams) {
  const { params } = resolveParams(inputParams);
  const used = new Set();
  const glyphs = {};
  [...charset].forEach((char) => {
    glyphs[char] = generateGlyph(char, params, 0, used);
  });
  return { glyphs, params };
}

export const cellAspect = (params) =>
  (params.cellW + params.gapX) / Math.max(1, params.cellH + params.gapY);

export function createUniforms(maxCells, params) {
  return {
    cellH: uniform(7, 'int'),
    cellW: uniform(8, 'int'),
    cols: uniform(1),
    cursive: uniform(1, 'int'),
    gapX: uniform(0, 'int'),
    gapY: uniform(0, 'int'),
    ink: colorUniform(params.ink),
    maxCells,
    flips: uniformArray(
      Array.from({ length: maxCells * 4 }, () => new THREE.Vector4()),
      'vec4'
    ),
    origins: uniformArray(
      Array.from({ length: maxCells }, () => new THREE.Vector4()),
      'vec4'
    ),
    paper: colorUniform(params.paper),
    rows: uniform(1),
    s4: [7, 0, 7, 7].map((v) => uniform(v, 'int')),
    script: [2, 7, 3, 5].map((v) => uniform(v, 'int')),
    scroll: uniform(0),
  };
}

const Lnode = (x, y, z) => {
  const a = x.bitXor(y);
  return a.bitAnd(a.mod(z)).bitXor(x);
};

export function buildNode(u) {
  return Fn(() => {
    const { cellIndex, local } = cellCoords(u.cols, u.rows);
    const origin = u.origins.element(int(cellIndex));
    const [sx, sy, sz, sw] = u.s4;
    const [cx, cy, cz, cw] = u.script;

    const px = int(local.x.mul(float(u.cellW.add(u.gapX))).floor());
    const py = int(local.y.mul(float(u.cellH.add(u.gapY))).floor());
    const inside = px
      .lessThan(u.cellW)
      .and(py.lessThan(u.cellH))
      .and(origin.z.greaterThan(0.5));

    const x = int(origin.x)
      .add(px)
      .add(int(time.mul(u.scroll).floor()));
    const y = int(origin.y).add(py);

    const jx = x.div(sx).mod(sw).add(sy);
    const jy = y.div(sx).mod(sw).add(sy);
    const cursive = u.cursive.equal(1);
    const kx = select(cursive, jx, jy);
    const ky = select(cursive, jy, jx);

    const t1 = Lnode(x.bitAnd(x.div(cx)), y.bitAnd(y.div(cx)), sz);
    const t2 = Lnode(x.bitAnd(x.div(cy)), y.bitAnd(y.div(cy)), sz);
    const t3 = Lnode(kx.bitAnd(jx.div(cz)), ky.bitAnd(jy.div(cz)), sz);
    const t4 = Lnode(jx.bitAnd(jx.div(cw)), jy.bitAnd(jy.div(cw)), sz);
    const result = t1.bitOr(t2).bitAnd(t3).bitAnd(t4);

    const pixel = py.mul(u.cellW).add(px);
    const word = pixel.div(BITS_PER_WORD).min(int(FLIP_WORDS - 1));
    const lane = u.flips.element(int(cellIndex).mul(4).add(word.div(4)));
    const slot = word.mod(4);
    const packed = int(
      select(
        slot.equal(0),
        lane.x,
        select(slot.equal(1), lane.y, select(slot.equal(2), lane.z, lane.w))
      )
    );
    const flip = packed
      .shiftRight(uint(pixel.mod(BITS_PER_WORD)))
      .bitAnd(int(1));
    const patternInk = select(result.notEqual(int(0)), int(1), int(0));
    const inked = patternInk.bitXor(flip).equal(int(1)).and(inside);
    return vec4(select(inked, u.ink, u.paper), 1);
  })();
}

/* eslint-disable no-param-reassign */
export function writeUniforms(u, font, layout) {
  const { params } = font;
  u.cols.value = layout.cols;
  u.rows.value = layout.rows;
  u.cellW.value = params.cellW;
  u.cellH.value = params.cellH;
  u.gapX.value = params.gapX;
  u.gapY.value = params.gapY;
  u.cursive.value = params.cursive ? 1 : 0;
  u.scroll.value = params.scroll;
  params.s4.forEach((v, i) => {
    u.s4[i].value = Math.max(1, Math.round(v));
  });
  u.s4[1].value = Math.max(0, Math.round(params.s4[1]));
  params.script.forEach((v, i) => {
    u.script[i].value = Math.max(1, Math.round(v));
  });
  u.ink.value.set(params.ink);
  u.paper.value.set(params.paper);

  for (let cell = 0; cell < u.maxCells; cell += 1) {
    const entry = layout.cells[cell];
    const glyph = entry?.key ? font.glyphs[entry.key] : null;
    u.origins.array[cell].set(glyph?.x ?? 0, glyph?.y ?? 0, glyph ? 1 : 0, 0);
    const words = packFlips(glyph, params);
    for (let lane = 0; lane < 4; lane += 1) {
      u.flips.array[cell * 4 + lane].set(
        words[lane * 4],
        words[lane * 4 + 1],
        words[lane * 4 + 2],
        words[lane * 4 + 3]
      );
    }
  }
}
/* eslint-enable no-param-reassign */

export default {
  buildNode,
  cellAspect,
  createUniforms,
  defaults,
  generateGlyph,
  generateGlyphs,
  generatorKeys,
  glyphBits,
  id: 'script',
  toggleFlip,
  label: 'Script',
  writeUniforms,
};
