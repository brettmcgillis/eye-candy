import { press } from '../hits';
import { INK } from '../kit';
import { TAU } from '../parts';
import { hash01 } from '../signals';

const CELL = 0.42;
const SMOKE = { c: [0.012, 0.012, 0.014], m: 0, r: 0.12 };
const GLASS_TOP = 0.05;
const UNLIT = { c: [0.022, 0.022, 0.024], m: 0, r: 0.5 };
const SEVERITY = [
  { level: 0.8, rgb: [1, 0.05, 0.02], weight: 0.25 },
  { level: 0.55, rgb: [1, 0.36, 0.01], weight: 0.45 },
  { level: 0.45, rgb: [0.12, 1, 0.22], weight: 0.15 },
  { level: 0.7, rgb: [0.12, 0.38, 1], weight: 0.15 },
];

const arc = (cx, cy, r, from, to, steps = 10) =>
  Array.from({ length: steps }, (_, i) => {
    const a0 = from + ((to - from) * i) / steps;
    const a1 = from + ((to - from) * (i + 1)) / steps;
    return [
      cx + r * Math.cos(a0),
      cy + r * Math.sin(a0),
      cx + r * Math.cos(a1),
      cy + r * Math.sin(a1),
    ];
  });
const polyline = (points) =>
  points.slice(1).map((p, i) => [...points[i], ...p]);
const dot = (x, y) => [x - 0.04, y, x + 0.04, y];

// Glyph strokes in a unit cell [-1, 1]²: a frame, a core symbol inside it,
// and sometimes a modifier, so the cluster reads as warnings without
// meaning any warning in particular.
const FRAMES = {
  circle: () => arc(0, 0, 0.88, 0, TAU, 18),
  parens: () => [
    ...arc(0.15, 0, 0.85, 2.1, 4.18, 7),
    ...arc(-0.15, 0, 0.85, -1.04, 1.04, 7),
  ],
  triangle: () =>
    polyline([
      [0, 0.86],
      [0.92, -0.72],
      [-0.92, -0.72],
      [0, 0.86],
    ]),
  box: () =>
    polyline([
      [-0.8, -0.65],
      [0.8, -0.65],
      [0.8, 0.65],
      [-0.8, 0.65],
      [-0.8, -0.65],
    ]),
  drop: () => [
    ...arc(0, -0.22, 0.6, 2.576, 0.565 + TAU, 14),
    [-0.51, 0.1, 0, 0.9],
    [0.51, 0.1, 0, 0.9],
  ],
  none: () => [],
};
const CORES = {
  bang: () => [[0, 0.5, 0, -0.15], dot(0, -0.42)],
  waves: () =>
    [-0.35, 0, 0.35].flatMap((y) =>
      polyline(
        Array.from({ length: 7 }, (_, i) => [
          -0.5 + i / 6,
          y + 0.1 * Math.sin(i * 1.6),
        ])
      )
    ),
  bolt: () =>
    polyline([
      [0.15, 0.6],
      [-0.2, 0.02],
      [0.2, 0.02],
      [-0.15, -0.6],
    ]),
  dots: () => [-0.35, 0, 0.35].map((x) => dot(x, 0)),
  bars: () =>
    [-0.36, 0, 0.36].map((x, i) => [x, -0.45, x, -0.45 + 0.35 * (i + 1)]),
  gauge: () => [
    ...arc(0, -0.25, 0.55, 0.3, Math.PI - 0.3, 8),
    [0, -0.25, 0.32, 0.18],
  ],
  cross: () => [
    [-0.4, -0.4, 0.4, 0.4],
    [-0.4, 0.4, 0.4, -0.4],
  ],
  coil: () =>
    arc(0, 0, 0.4, 0, TAU * 0.8, 12).concat(arc(0, 0, 0.2, 0, TAU * 0.7, 7)),
  ladder: () => [
    [-0.25, -0.5, -0.25, 0.5],
    [0.25, -0.5, 0.25, 0.5],
    ...[-0.25, 0.05, 0.35].map((y) => [-0.25, y, 0.25, y]),
  ],
};
const MODIFIERS = {
  strike: () => [[-0.75, -0.75, 0.75, 0.75]],
  underline: () => [[-0.55, -0.95, 0.55, -0.95]],
  ticks: () => [
    [-1.05, 0.3, -1.05, -0.3],
    [1.05, 0.3, 1.05, -0.3],
  ],
};

const pickKey = (rng, table) => {
  const keys = Object.keys(table);
  return keys[Math.floor(rng() * keys.length)];
};

function rollGlyph(rng) {
  const frame = pickKey(rng, FRAMES);
  const core = pickKey(rng, CORES);
  const modifier = rng() < 0.35 ? pickKey(rng, MODIFIERS) : null;
  let roll = rng();
  const severity = SEVERITY.findIndex(({ weight }) => {
    roll -= weight;
    return roll <= 0;
  });
  const strokes = [
    ...FRAMES[frame](),
    ...CORES[core](),
    ...(modifier ? MODIFIERS[modifier]() : []),
  ];
  return { severity: Math.max(0, severity), strokes };
}

// A car-style telltale cluster: cryptic glyph lamps dark behind smoked glass
// until some unseen fault lights one. Most come and go, critical (red) ones
// blink while lit, a few burn steady; a click flips a lamp.
export default function buildTelltales(kit, { h, w }) {
  const { rng, slab, style } = kit;
  const hw = w / 2 - 0.2;
  const hh = h / 2 - 0.2;
  const cols = Math.max(2, Math.floor((2 * hw) / CELL));
  const rows = Math.max(1, Math.floor((2 * hh) / CELL));
  const pitchX = (2 * hw) / cols;
  const pitchY = (2 * hh) / rows;
  const size = Math.min(pitchX, pitchY) * 0.3;
  const lamps = Array.from({ length: cols * rows }, (_, i) => ({
    ...rollGlyph(rng),
    habit: rng(),
    x: ((i % cols) - (cols - 1) / 2) * pitchX,
    y: ((rows - 1) / 2 - Math.floor(i / cols)) * pitchY,
  }));
  const stroke = (x, y, [x0, y0, x1, y1], look) =>
    slab(
      x + ((x0 + x1) / 2) * size,
      y + ((y0 + y1) / 2) * size,
      (Math.hypot(x1 - x0, y1 - y0) / 2) * size + size * 0.07,
      size * 0.07,
      GLASS_TOP,
      GLASS_TOP + INK,
      look,
      Math.atan2(y1 - y0, x1 - x0)
    );
  const lit = (lamp, index, t) => {
    if (lamp.habit < 0.1) return true;
    const period = 6 + 9 * hash01(index, 41);
    const epoch = Math.floor(t / period + hash01(index, 42));
    const on = hash01(index, epoch) < 0.3;
    if (!on || lamp.severity !== 0) return on;
    return (t * 1.6) % 1 < 0.6;
  };

  return {
    live: true,
    statics: [
      slab(0, 0, w / 2 - 0.08, h / 2 - 0.08, 0, 0.03, style.knob, 0, 'rbox'),
      slab(0, 0, hw + 0.02, hh + 0.02, 0.03, GLASS_TOP, SMOKE, 0, 'rbox'),
    ],
    hits: lamps.map(({ x, y }, i) =>
      press(i, x, y, { hh: pitchY * 0.45, hw: pitchX * 0.45 })
    ),
    signals: lamps.map(() => ({ base: 0, fixed: true, kind: 'switch' })),
    pose: (flips, { t }) =>
      lamps.flatMap((lamp, i) => {
        let on = lit(lamp, i, t);
        if (flips[i] > 0.5) on = !on;
        const { level, rgb } = SEVERITY[lamp.severity];
        const look = on ? style.lit(rgb, level) : UNLIT;
        return lamp.strokes.map((s) => stroke(lamp.x, lamp.y, s, look));
      }),
  };
}
