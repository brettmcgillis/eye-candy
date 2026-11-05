import { detent } from '../hits';
import { STAMP_NONE } from '../interaction';
import { part, placeAll, quatX, quatY } from '../parts';
import { hash01 } from '../signals';
import { glyphBit } from './glyphs';

const DIGITS = '0123456789';
const ALPHABETS = [
  DIGITS,
  ' ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
];
const FLAP = { c: [0.012, 0.012, 0.014], m: 0, r: 0.55 };
const HALF_THICK = 0.007;
const FACE = 0.003;
const LEAN = 0.03;
const LEAN_STEP = 0.06;
const LAND_TILT = 0.04;
const LAND_SPREAD = 0.08;
const VISIBLE_BACK = 0.65;
const VISIBLE_FRONT = 0.75;

const mod = (a, n) => ((a % n) + n) % n;
const clamp01 = (x) => Math.min(Math.max(x, 0), 1);

// A flap's angle about the spindle, 0 upright and π hanging, given how far
// `x` flaps it is past the drum position: still standing in the stack
// behind (x < 0, leaning further back the deeper it sits), falling forward
// (0 ≤ x < 1, accelerating, released from rest) or landed on the stack
// below (x ≥ 1, the newest in front, rebounding once as it lands).
function flapAngle(x) {
  if (x < 0) return -(LEAN + LEAN_STEP * Math.min(-x, 3));
  const landed = Math.PI - (LAND_TILT + LAND_SPREAD);
  if (x < 1) return -LEAN + (landed + LEAN) * x * x;
  const age = x - 1;
  const settle = LAND_TILT + LAND_SPREAD * clamp01(1 - age / 2);
  const rebound = 0.16 * Math.exp(-6 * age) * Math.abs(Math.sin(14 * age));
  return Math.PI - settle - rebound;
}

// One half of a 3 × 5 glyph in a flap's own frame (hinge at the origin,
// +y up the flap). The seam cuts the middle row in two. A flap's back is
// turned over when it falls, so its glyph is flipped in y to read upright
// once it hangs.
function halfGlyph(slab, char, top, { cell, mirror, z }, look) {
  const [cw, ch] = cell;
  const sign = mirror ? -1 : 1;
  const out = [];
  const first = top ? 0 : 2;
  const last = top ? 2 : 4;
  for (let row = first; row <= last; row += 1) {
    let y0 = (2.5 - row) * ch;
    let y1 = y0 - ch;
    if (row === 2) {
      if (top) y1 = 0;
      else y0 = 0;
    }
    for (let col = 0; col < 3; col += 1) {
      if (glyphBit(char, col, row)) {
        const start = col;
        while (col < 2 && glyphBit(char, col + 1, row)) col += 1;
        const width = col - start + 1;
        out.push(
          slab(
            (start + width / 2 - 1.5) * cw,
            (sign * (y0 + y1)) / 2,
            (width * cw * 0.94) / 2,
            ((y0 - y1) / 2) * 0.9,
            z,
            z + FACE,
            look
          )
        );
      }
    }
  }
  return out;
}

export default function buildSplitFlap(kit, { h, variant, w }) {
  const { rng, slab, style } = kit;
  const rows = h >= 2 ? 2 : 1;
  const uh = Math.min(0.7, rows === 1 ? h - 0.34 : (h - 0.52) / 2);
  const uw = uh * 0.7;
  const pitch = uw + 0.05;
  const count = Math.max(1, Math.min(12, Math.floor((w - 0.34) / pitch)));
  const total = rows * count;
  const reach = uh / 2 - 0.02;
  const hinge = 0.13;
  const top = hinge + reach + 0.03;

  const rolledCounter = rng() < 0.4;
  const alphabetPick = Math.floor(rng() * ALPHABETS.length);
  const glyphWhite = rng() < 0.55;
  const glyphCap = Math.floor(rng() * 3);
  const rate = 9 + rng() * 4;
  const stagger = 0.08 + rng() * 0.08;
  const slow = 3 + rng() * 3;
  const tick = 0.6 + rng() * 1.4;
  const seeds = Array.from({ length: rows }, () => Math.floor(rng() * 2 ** 31));
  const starts = Array.from({ length: rows }, () =>
    Math.floor(rng() * 10 ** count)
  );

  const counter = variant ? variant === 'counter' : rolledCounter;
  const alphabet = counter ? DIGITS : ALPHABETS[alphabetPick];
  const n = alphabet.length;
  const period = Math.max(slow, n / rate + count * stagger + 0.8);
  const look = glyphWhite ? style.legend : style.cap(glyphCap);

  const cell = [(uw * 0.74) / 3, (reach * 2 * 0.8) / 5];
  const front = { cell, mirror: false, z: HALF_THICK };
  const back = { cell, mirror: true, z: -HALF_THICK - FACE };
  const body = part(
    'box',
    [0, reach / 2, 0],
    [uw / 2 - 0.012, reach / 2, HALF_THICK],
    FLAP
  );
  const hw = (count * pitch) / 2;
  const unitX = (col) => (col - (count - 1) / 2) * pitch;
  const rowY = (row) =>
    rows === 1 ? 0 : (row === 0 ? 1 : -1) * (uh / 2 + 0.09);

  const statics = [];
  const spindle = (x, y) =>
    part(
      'cyl',
      [x, y, hinge],
      [0.016, 0.016, uw / 2],
      style.hole,
      quatY(Math.PI / 2)
    );
  for (let row = 0; row < rows; row += 1) {
    const y = rowY(row);
    statics.push(
      slab(0, y, hw + 0.07, uh / 2 + 0.07, 0, 0.04, style.hole),
      slab(0, y + uh / 2 + 0.012, hw + 0.012, 0.014, 0.04, top, style.brushed),
      slab(0, y - uh / 2 - 0.012, hw + 0.012, 0.014, 0.04, top, style.brushed)
    );
    for (let i = 0; i <= count; i += 1) {
      statics.push(
        slab(
          (i - count / 2) * pitch,
          y,
          0.012,
          uh / 2,
          0.04,
          top,
          style.brushed
        )
      );
    }
    for (let col = 0; col < count; col += 1)
      statics.push(spindle(unitX(col), y));
  }

  const position = (row, col, t) => {
    if (counter) {
      const significance = 10 ** (count - 1 - col);
      const x = starts[row] + t * tick;
      const ticks = Math.floor(x / significance);
      const since = (x - ticks * significance) / tick;
      return ticks + Math.min(1, since * rate);
    }
    const local = t - col * stagger - row * 0.31;
    const cycle = Math.floor(local / period);
    const pick = (k) => Math.floor(hash01(seeds[row] + col * 977, k) * n);
    const previous = pick(cycle - 1);
    const distance = mod(pick(cycle) - previous, n);
    return previous + Math.min(distance, (local - cycle * period) * rate);
  };

  const char = (j) => alphabet[mod(j, n)];

  // Where unit `i` is drawn: its automatic position, or the character a
  // hand holds it on. A click stamps its moment and where the drum was, so
  // from there the drum rolls forward to the new position at the flip rate.
  const resolve = (i, hold, stamp, from, t) => {
    const held = Math.round(hold * n);
    const target =
      held > 0 ? held - 1 : position(Math.floor(i / count), i % count, t);
    if (stamp <= STAMP_NONE / 2 || t < stamp) return target;
    return from + Math.min(mod(target - from, n), (t - stamp) * rate);
  };

  function drum(x, y, p) {
    const base = Math.floor(p);
    const parts = [];
    for (let j = base - 2; j <= base + 2; j += 1) {
      const past = p - j;
      const flap = [body];
      if (past > -1 && past < VISIBLE_FRONT)
        flap.push(...halfGlyph(slab, char(j), true, front, look));
      if (past > VISIBLE_BACK && past < 2)
        flap.push(...halfGlyph(slab, char(j + 1), false, back, look));
      parts.push(
        ...placeAll(flap, { offset: [x, y, hinge], q: quatX(flapAngle(past)) })
      );
    }
    return parts;
  }

  return {
    hits: Array.from({ length: total }, (_, i) =>
      detent(
        3 * i,
        unitX(i % count),
        rowY(Math.floor(i / count)),
        uw / 2,
        n + 1,
        {
          at: (get, now) =>
            mod(resolve(i, get(3 * i), get(3 * i + 1), get(3 * i + 2), now), n),
          from: 3 * i + 2,
          time: 3 * i + 1,
        }
      )
    ),
    live: true,
    pose: (values, { t }) =>
      Array.from({ length: total }, (_, i) =>
        drum(
          unitX(i % count),
          rowY(Math.floor(i / count)),
          resolve(i, values[3 * i], values[3 * i + 1], values[3 * i + 2], t)
        )
      ).flat(),
    signals: Array.from({ length: total }, () => [
      { base: 0, fixed: true, kind: 'step', steps: n + 1 },
      { base: STAMP_NONE, fixed: true, kind: 'smooth' },
      { base: 0, fixed: true, kind: 'smooth' },
    ]).flat(),
    statics,
  };
}
