import { detent, pull, stamp } from '../hits';
import { STAMP_NONE } from '../interaction';
import { TAU, part, placeAll, quatMul, quatX, quatY } from '../parts';
import { hash01 } from '../signals';
import buildFanfold from './fanfold';
import { textParts } from './glyphs';
import { createDropPath, drift, dropped } from './paperDrop';

const PAPER = { c: [0.86, 0.84, 0.76], m: 0, r: 0.9 };
const DARK = { c: [0.03, 0.03, 0.035], m: 0, r: 0.7 };
const FAINT = { c: [0.58, 0.56, 0.5], m: 0, r: 0.8 };

const ROW = 0.1;
const HALF = 0.004;
const BODY = 14;
const TRAIL = 3;
const ROWS = BODY + TRAIL;
const ROW_DT = 0.55;
const CYCLE = ROWS * ROW_DT;
const KEEP = 8;
const PRE = (KEEP + 1) * CYCLE;
const EASE = 0.22;
const DROOP = 0.22;
const GRAVITY = 9;
const STEP = 0.02;
const SLIT_Z = 0.3;
const STACK = 0.01;
const GROUP = 3;
const PULL_ROWS = 6;
const SLOTS = 12;
const PRESS = 0.3;
const RED = { c: [0.75, 0.03, 0.02], m: 0, r: 0.3 };

const ICONS = {
  annunciator: 'dot',
  bigGauge: 'arc',
  bigKnob: 'ring',
  button: 'square',
  buttonRow: 'square',
  dipswitches: 'bar',
  encoder: 'ring',
  fader: 'slot',
  faderBank: 'slot',
  gauge: 'arc',
  jack: 'hole',
  keypad: 'square',
  keyswitch: 'bar',
  knob: 'ring',
  ledMatrix: 'dot',
  leds: 'dot',
  meter: 'slot',
  patchBay: 'hole',
  piano: 'square',
  rocker: 'bar',
  selector: 'ring',
  thumbwheel: 'ring',
  toggle: 'bar',
  trackball: 'ring',
};

const clamp01 = (x) => Math.min(Math.max(x, 0), 1);
const smooth = (x) => x * x * (3 - 2 * x);
const lerp = (a, b, k) => a + (b - a) * k;
const phiOf = (s) => (Math.PI / 2) * (1 - Math.exp(-Math.max(s, 0) / DROOP));

// The strip leaves the slit heading straight out and droops under its own
// weight to hang: a table of how far down (y) and out (z) a point `s` along
// it has gone.
function createCurve() {
  const n = Math.ceil((ROWS * ROW + 0.2) / STEP);
  const y = [0];
  const z = [0];
  for (let i = 1; i <= n; i += 1) {
    const phi = phiOf((i - 0.5) * STEP);
    y.push(y[i - 1] + Math.sin(phi) * STEP);
    z.push(z[i - 1] + Math.cos(phi) * STEP);
  }
  const read = (table, s) => {
    const x = clamp01(s / (n * STEP)) * n;
    const i = Math.min(Math.floor(x), n - 1);
    return lerp(table[i], table[i + 1], x - i);
  };
  return {
    down: (s) => read(y, s),
    out: (s) => read(z, s),
    phi: (s) => phiOf(s),
  };
}

function pictogram(kit, id, x, y) {
  const { disc, slab } = kit;
  const a = 0.03;
  const z = HALF;
  const top = z + 0.0015;
  switch (ICONS[id]) {
    case 'ring':
      return [
        disc(x, y, a, z, top, DARK),
        disc(x, y, a * 0.55, top, top + 0.0015, PAPER),
        slab(x, y + a * 0.3, 0.004, a * 0.35, top + 0.0015, top + 0.003, DARK),
      ];
    case 'arc':
      return [
        ...[-1, 0, 1].map((i) =>
          disc(x + i * a * 0.8, y - Math.abs(i) * a * 0.3, 0.007, z, top, DARK)
        ),
        slab(x, y - a * 0.2, 0.004, a * 0.7, z, top, DARK, 0.5),
      ];
    case 'square':
      return [
        slab(x, y, a * 0.9, a * 0.9, z, top, DARK),
        slab(x, y, a * 0.55, a * 0.55, top, top + 0.0015, PAPER),
      ];
    case 'bar':
      return [
        slab(x, y, a, 0.007, z, top, DARK),
        disc(x + a * 0.5, y, 0.014, z, top + 0.0015, DARK),
      ];
    case 'slot':
      return [
        slab(x, y, 0.005, a, z, top, DARK),
        slab(x, y + a * 0.3, a * 0.5, 0.008, z, top + 0.0015, DARK),
      ];
    case 'hole':
      return [
        disc(x, y, a, z, top, DARK),
        disc(x, y, a * 0.45, top, top + 0.0015, PAPER),
      ];
    case 'dot':
      return [disc(x, y, a * 0.6, z, top, DARK)];
    default:
      return [slab(x, y, a * 0.8, a * 0.8, z, top, DARK, Math.PI / 4)];
  }
}

// Cooling slots down both sides of a cabinet's lower front, outside the
// paper's path, from x = ±from to ±to.
export function vents(kit, { bottom, from, to, top, z }) {
  if (to - from < 0.05 || top - bottom < 0.1) return [];
  const rows = Math.floor((top - bottom) / 0.07);
  return [-1, 1].flatMap((side) =>
    Array.from({ length: rows }, (_, i) =>
      kit.slab(
        (side * (from + to)) / 2,
        bottom + (i + 0.5) * ((top - bottom) / rows),
        (to - from) / 2,
        0.011,
        z,
        z + 0.004,
        kit.style.hole,
        0,
        'rbox'
      )
    )
  );
}

export default function buildPrinter(kit, { h, variant, w }) {
  const { rng, slab, style } = kit;
  const fanfold = variant ? variant === 'fanfold' : rng() < 0.4;
  if (fanfold) return buildFanfold(kit, { h, w });
  const seed = Math.floor(rng() * 2 ** 31);
  const ledIndex = Math.floor(rng() * 3);
  const hw = w / 2 - 0.1;
  const hh = h / 2 - 0.1;
  const width = Math.min(0.62, (w - 0.3) * 0.75);
  const bodyH = 2 * hh;
  const slitY = hh - 0.34;
  let curve = createCurve();

  const world = { drop: false, floor: -3, manifest: [], scale: 1 };
  const foot = -h / 2;
  const memo = new Map();
  const cached = (name, make) => {
    if (!memo.has(name)) {
      if (memo.size > 600) memo.clear();
      memo.set(name, make());
    }
    return memo.get(name);
  };
  const paper = (length) =>
    part('box', [0, 0, 0], [width / 2, (length / 2) * 1.04, HALF], PAPER);

  const slitYDrop = (s) => slitY - curve.down(s);

  function journal(k, r, sample, start) {
    const { manifest } = world;
    const key = k * 64 + r;
    const entry =
      manifest.length > 0
        ? manifest[Math.floor(hash01(seed, key * 3 + 1) * manifest.length)]
        : null;
    const signal = entry
      ? Math.floor(hash01(seed, key * 3 + 2) * entry.signals)
      : 0;
    const at = start + r * ROW_DT;
    const v = entry ? sample(entry.key, signal, at) : hash01(seed, key * 3 + 3);
    const left = -width / 2;
    const percent = Math.round(Math.min(Math.max(v, 0), 1) * 99);
    const level = percent / 99;
    return cached(`${entry?.id}:${percent}`, () => [
      ...pictogram(kit, entry?.id, left + 0.07, 0),
      slab(left + 0.26, 0, 0.1, 0.012, HALF, HALF + 0.0015, FAINT),
      slab(
        left + 0.16 + 0.1 * level,
        0,
        Math.max(0.1 * level, 0.002),
        0.012,
        HALF + 0.0015,
        HALF + 0.003,
        DARK
      ),
      ...textParts(
        kit,
        String(percent).padStart(2, '0'),
        left + 0.4,
        0.0275,
        0.011,
        HALF,
        DARK
      ),
    ]);
  }

  function buildHeader(k) {
    let cursor = -width / 2 + 0.06;
    const out = [];
    for (let i = 0; i < 3; i += 1) {
      const len = 0.06 + hash01(seed, k * 5 + i) * 0.14;
      if (cursor + len < width / 2 - 0.05) {
        out.push(
          slab(cursor + len / 2, 0, len / 2, 0.014, HALF, HALF + 0.0015, DARK)
        );
      }
      cursor += len + 0.04;
    }
    return out;
  }

  function buildBarcode(k) {
    const out = [];
    let cursor = -0.2;
    for (let i = 0; i < 18 && cursor < 0.2; i += 1) {
      const len = 0.006 + hash01(seed, k * 31 + i) * 0.012;
      out.push(
        slab(cursor + len / 2, 0, len / 2, 0.034, HALF, HALF + 0.0015, DARK)
      );
      cursor += len + 0.006 + hash01(seed, k * 37 + i) * 0.008;
    }
    return out;
  }

  const header = (k) => cached(`h${k}`, () => buildHeader(k));
  const barcode = (k) => cached(`b${k}`, () => buildBarcode(k));

  const ink = (k, r, sample, start) => {
    if (r === 0) return header(k);
    if (r === BODY - 1) return barcode(k);
    if (r < BODY) return journal(k, r, sample, start);
    return [];
  };

  const fed = (u) => {
    const index = Math.floor(u / ROW_DT);
    return index + smooth(clamp01((u / ROW_DT - index) / EASE));
  };

  // Receipts run back to back on a clock; a hand tear ends the current one
  // early and starts the next at that moment, shifting every later receipt
  // by `d`. Stamps replayed in order give the same schedule from any `t`.
  function schedule(stamps, t) {
    const segments = [{ d: 0, from: -Infinity }];
    const torn = new Map();
    let d = 0;
    stamps
      .filter(({ time }) => time > STAMP_NONE / 2 && time <= t)
      .sort((a, b) => a.time - b.time)
      .forEach(({ carry, time }) => {
        const clock = time + PRE - d;
        const index = Math.floor(clock / CYCLE);
        torn.set(index, { carry, rows: fed(clock - index * CYCLE), time });
        d = time + PRE - (index + 1) * CYCLE;
        segments.push({ d, from: index + 1 });
      });
    return { d, segments, torn };
  }

  // The strip's rows are `f` fed, shifted `pulled` rows down; the paper
  // between the slit and the newest printed row is blank.
  function strip(k, u, t, pulled, sample) {
    const f = fed(u);
    const printed = Math.min(ROWS, Math.ceil(f));
    const parts = [];
    for (let r = 0; r < Math.ceil(f + pulled); r += 1) {
      const s = (f - r + pulled) * ROW - ROW / 2;
      const sway = 0.012 * Math.sin(1.9 * t - 2.6 * s) * clamp01(s / 0.5);
      const marks = r < printed ? ink(k, r, sample, t - u) : [];
      parts.push(
        ...placeAll([paper(ROW), ...marks], {
          offset: [0, slitY - curve.down(s), SLIT_Z + curve.out(s) + sway],
          q: quatX(curve.phi(s) - Math.PI / 2),
        })
      );
    }
    return parts;
  }

  // A cut piece falls rigidly under gravity, then settles into a curled
  // slip on the pile: a blend of the two poses, mostly the fall until it
  // nears the floor. `rows` is how much of a receipt it holds and `carry`
  // how far the paper had been pulled out when it came off.
  function piece({ carry, p, rank, rows, sample, start, tau }, full) {
    const group = full ? 1 : GROUP;
    const px = ((hash01(seed, p * 7 + 1) - 0.5) * 0.9) / world.scale;
    const pz = (0.95 + (hash01(seed, p * 7 + 2) - 0.5) * 0.6) / world.scale;
    const yaw = hash01(seed, p * 7 + 3) * TAU;
    const curl = 0.04 + hash01(seed, p * 7 + 4) * 0.05;
    const roll = hash01(seed, p * 7 + 5) < 0.5 ? -1 : 1;
    const length = rows * ROW;
    const hung = (rows + carry) * ROW;
    const floor = world.floor + HALF + rank * STACK;
    const lowest = slitYDrop(hung);
    // With `drop` there is no floor: the piece falls until it is culled.
    const land = world.drop
      ? Infinity
      : Math.sqrt((2 * Math.max(lowest - floor, 0.05) * world.scale) / GRAVITY);
    const b = world.drop ? 0 : smooth(clamp01(tau / land)) ** 2;
    const drop = world.drop
      ? dropped(tau, world.scale)
      : (0.5 * GRAVITY * Math.min(tau, land) ** 2) / world.scale;
    if (drop == null) return [];
    const spin = yaw * b;
    const count = Math.ceil(rows);
    const parts = [];
    for (let first = 0; first < count; first += group) {
      const n = Math.min(group, count - first);
      const hang = (rows + carry - first - n / 2) * ROW;
      const a = (rows - first - n / 2) * ROW - length / 2;
      const slope = (-8 * curl * a) / (length * length);
      const alpha = lerp(
        curve.phi(hang) - Math.PI / 2,
        -Math.atan(slope) - Math.PI / 2,
        b
      );
      const dz = lerp(curve.out(hang) - curve.out(hung / 2), a * 0.82, b);
      const y = lerp(
        slitYDrop(hang) - drop,
        floor + curl * (1 - ((2 * a) / length) ** 2),
        b
      );
      const centerZ = lerp(SLIT_Z + curve.out(hung / 2), pz, b);
      // A dropped page falls flat, as one sheet.
      const rolled = world.drop ? 0 : roll * 0.7 * Math.sin(7 * tau) * (1 - b);
      const away = world.drop ? drift(drop, world.scale) : 0;
      const marks = full
        ? Array.from({ length: n }, (_, i) => i).flatMap((i) =>
            ink(p, first + i, sample, start)
          )
        : [slab(-0.04, 0, 0.15, 0.012, HALF, HALF + 0.0015, FAINT)];
      parts.push(
        ...placeAll([paper(n * ROW), ...marks], {
          offset: [
            lerp(0, px, b) + dz * Math.sin(spin),
            y,
            centerZ + dz * Math.cos(spin) + away,
          ],
          q: quatMul(quatY(spin), quatMul(quatX(alpha), quatY(rolled))),
        })
      );
    }
    return parts;
  }

  const housing = slab(
    0,
    hh - bodyH / 2,
    hw,
    bodyH / 2,
    0,
    SLIT_Z,
    style.knob,
    0,
    'rbox'
  );
  const bandY = hh - 0.17;
  const feedX = hw - 0.26;
  const cutX = hw - 0.12;
  const feedCap = Math.floor(rng() * 3);
  const statics = [
    housing,
    slab(
      0,
      slitY,
      Math.min(width / 2 + 0.05, hw - 0.1),
      0.022,
      SLIT_Z,
      SLIT_Z + 0.006,
      style.hole
    ),
    ...kit.legend(-hw + 0.26, bandY, Math.min(0.4, 2 * hw - 0.62), 0.03, {
      align: 'left',
      z0: SLIT_Z,
    }),
    ...kit.led(-hw + 0.14, bandY, 0.035, ledIndex, 1, { z0: SLIT_Z }),
    kit.disc(feedX, bandY, 0.058, SLIT_Z, SLIT_Z + 0.004, style.hole),
    kit.disc(cutX, bandY, 0.058, SLIT_Z, SLIT_Z + 0.004, style.hole),
    ...[-1, 1].flatMap((side) =>
      kit.screw(side * (hw - 0.12), hh - bodyH + 0.12, 0.035, SLIT_Z)
    ),
    ...vents(kit, {
      bottom: -hh + 0.24,
      from: width / 2 + 0.06,
      to: hw - 0.07,
      top: slitY - 0.3,
      z: SLIT_Z,
    }),
  ];

  const slots = Array.from({ length: SLOTS }, (_, i) => [1 + 2 * i, 2 + 2 * i]);
  const cap = (x, held, look) =>
    kit.disc(
      x,
      bandY,
      0.044,
      SLIT_Z + 0.004,
      SLIT_Z + (held ? 0.03 : 0.045),
      look,
      'cap'
    );

  return {
    bind({ bounds, controls, drop = false, transform }) {
      world.drop = drop;
      world.scale = transform.scale;
      curve = drop
        ? createDropPath({
            foot,
            length: (ROWS + PULL_ROWS) * ROW + 0.4,
            phiOf,
            scale: transform.scale,
            slitY,
          })
        : createCurve();
      world.floor =
        (bounds.min[1] - 1.8 - transform.offset[1]) / transform.scale;
      world.manifest = controls
        .map((control, key) => ({
          id: control.id,
          key,
          signals: control.signals.length,
        }))
        .filter((entry) => entry.signals > 0 && entry.id !== 'printer');
      const reach = 0.8 / transform.scale + width;
      return {
        max: [reach, slitY + 0.1, 1.6 / transform.scale],
        min: [-reach, world.floor - 0.1, 0],
      };
    },
    hits: [
      detent(0, feedX, bandY, 0.058, PULL_ROWS + 1),
      stamp(0, slots, cutX, bandY, { hh: 0.058, hw: 0.058 }),
      pull(0, slots, 0, slitY - 0.85, width / 2 + 0.04, 0.85, PULL_ROWS * ROW),
    ],
    live: true,
    loose: true,
    pose: (values, { sample, t }) => {
      const pulled = values[0] * PULL_ROWS;
      const stamps = slots.map(([time, carry]) => ({
        carry: values[carry] * PULL_ROWS,
        time: values[time],
      }));
      const { d, segments, torn } = schedule(stamps, t);
      const clock = t + PRE - d;
      const k = Math.floor(clock / CYCLE);
      const u = clock - k * CYCLE;
      const cutting = stamps.some(
        ({ time }) => t - time >= 0 && t - time < PRESS
      );
      const parts = [
        cap(feedX, false, style.cap(feedCap)),
        cap(cutX, cutting, RED),
        ...strip(k, u, t, pulled, sample),
      ];
      for (let p = k - 1; p >= k - KEEP; p -= 1) {
        const shift = segments.reduce(
          (at, seg) => (seg.from <= p ? seg.d : at),
          0
        );
        const hand = torn.get(p);
        const info = {
          carry: hand ? hand.carry : pulled,
          p,
          rank: p - (k - KEEP),
          rows: hand ? hand.rows : ROWS,
          sample,
          start: p * CYCLE - PRE + shift,
          tau: t - (hand ? hand.time : (p + 1) * CYCLE - PRE + shift),
        };
        if (info.rows >= 1) parts.push(...piece(info, p === k - 1));
      }
      return parts;
    },
    signals: [
      { base: 0, fixed: true, kind: 'smooth' },
      ...slots.flatMap(() => [
        { base: STAMP_NONE, fixed: true, kind: 'smooth' },
        { base: 0, fixed: true, kind: 'smooth' },
      ]),
    ],
    statics,
  };
}
