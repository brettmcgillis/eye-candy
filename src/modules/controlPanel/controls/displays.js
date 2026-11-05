import { dial } from '../hits';
import { part, rot2 } from '../parts';

const SEGMENTS = {
  a: [0, 1, 1, 0],
  b: [1, 0.5, 0, 1],
  c: [1, -0.5, 0, 1],
  d: [0, -1, 1, 0],
  e: [-1, -0.5, 0, 1],
  f: [-1, 0.5, 0, 1],
  g: [0, 0, 1, 0],
};
const DIGITS = [
  'abcdef',
  'bc',
  'abdeg',
  'abcdg',
  'bcfg',
  'acdfg',
  'acdefg',
  'abc',
  'abcdefg',
  'abcdfg',
];
const COUNTER_RATES = [1, 2, 15, 30];

export function buildSevenSeg(kit, { h, variant, w }) {
  const { rng, slab, style } = kit;
  const dh = Math.min(h - 0.3, 1.5) / 2;
  const dw = dh * 0.55;
  const t = dh * 0.12;
  const count = Math.max(1, Math.floor((w - 0.3) / (dw * 2.9)));
  const pitch = dw * 2.9;
  const colorIndex = Math.floor(rng() * 3);
  const rolledCounter = rng() < 0.5;
  const counter = variant ? variant === 'counter' : rolledCounter;
  const rates = Array.from(
    { length: count },
    (_, i) => COUNTER_RATES[(count - 1 - i) % 4] * (0.5 + rng())
  );
  const xs = Array.from(
    { length: count },
    (_, i) => (i - (count - 1) / 2) * pitch
  );
  const segment = (x, y, id, level) => {
    const [sx, sy, horizontal] = SEGMENTS[id];
    const look = style.led(colorIndex, level);
    return horizontal
      ? slab(x + sx * dw, y + sy * dh, dw * 0.8, t / 2, 0.03, 0.035, look)
      : slab(x + sx * dw, y + sy * dh, t / 2, dh * 0.42, 0.03, 0.035, look);
  };
  return {
    live: true,
    statics: [
      slab(0, 0, w / 2 - 0.1, dh + 0.13, 0, 0.03, style.glass, 0, 'rbox'),
      ...kit.legend(-w / 2 + 0.12, -dh - 0.2, 0.4, 0.03, { align: 'left' }),
    ],
    hits: [{ ...dial(0, 0, 0, null), hh: dh + 0.13, hw: w / 2 - 0.1 }],
    signals: ['smooth'],
    pose: ([v], { t: time }) => {
      const number = Math.floor(v * 10 ** count);
      return xs.flatMap((x, i) => {
        const digit = counter
          ? (Math.floor(time * rates[i]) + Math.round(v * 9)) % 10
          : Math.floor(number / 10 ** (count - 1 - i)) % 10;
        const on = DIGITS[digit];
        return Object.keys(SEGMENTS).map((id) =>
          segment(x, 0, id, on.includes(id) ? 1 : 0)
        );
      });
    },
  };
}

export function buildSpeaker(kit, { h, variant: forced, w }) {
  const { disc, rng, slab, style } = kit;
  const statics = [];
  let variant = rng() < 0.6 ? 'holes' : 'slots';
  if (Math.min(w, h) >= 2 && rng() < 0.3) variant = 'cone';
  if (forced) variant = forced;
  const hw = w / 2 - 0.1;
  const hh = h / 2 - 0.1;
  if (variant === 'cone') {
    const r = Math.min(hw, hh) * 0.9;
    const depth = 0.24;
    const wall = 0.05;
    const side = r + 0.03;
    // A walled housing the cone sits down inside: the plate is solid, so
    // the recess is built up from it rather than cut into it.
    [-1, 1].forEach((sign) => {
      statics.push(
        slab(
          0,
          sign * (side + wall / 2),
          side + wall,
          wall / 2,
          0,
          depth,
          style.knob
        ),
        slab(sign * (side + wall / 2), 0, wall / 2, side, 0, depth, style.knob)
      );
    });
    statics.push(
      disc(0, 0, side, 0, 0.006, style.hole),
      part(
        'dish',
        [0, 0, (0.03 + depth) / 2],
        [r, r, (depth - 0.03) / 2],
        style.rubber
      ),
      part('torus', [0, 0, depth - 0.01], [r, r, 0.035], style.rubber),
      part('sphere', [0, 0, 0.03], [r * 0.24, r * 0.24, r * 0.1], style.knob)
    );
    [-1, 1].forEach((sx) =>
      [-1, 1].forEach((sy) => {
        const [cx, cy] = [sx * side * 0.86, sy * side * 0.86];
        statics.push(
          slab(cx, cy, side * 0.14, side * 0.14, 0, depth, style.knob),
          ...kit.screw(cx, cy, 0.035, depth)
        );
      })
    );
  } else if (variant === 'holes') {
    const pitch = Math.max(0.1, Math.sqrt((4 * hw * hh) / 900));
    const reach = Math.hypot(hw, hh);
    for (let a = -reach; a <= reach; a += pitch) {
      for (let b = -reach; b <= reach; b += pitch) {
        const [x, y] = rot2(a, b, Math.PI / 4);
        const fade = Math.min(
          1,
          (hw - Math.abs(x)) / 0.2,
          (hh - Math.abs(y)) / 0.2
        );
        if (fade > 0.15)
          statics.push(disc(x, y, pitch * 0.22 * fade, 0, 0.003, style.hole));
      }
    }
  } else {
    for (let y = -hh + 0.06; y <= hh - 0.05; y += 0.11)
      statics.push(
        slab(0, y, hw - 0.05, 0.025, 0, 0.003, style.hole, 0, 'rbox')
      );
  }
  return { statics, signals: [], pose: null };
}
