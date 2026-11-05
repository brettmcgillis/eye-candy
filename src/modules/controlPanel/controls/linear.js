import { latch, press, slide } from '../hits';
import { INK } from '../kit';
import { placeAll } from '../parts';
import { hash01 } from '../signals';

// Builders laid out along a module's long axis: `u` runs along it, `v`
// across, so one description serves horizontal and vertical modules.
function axisKit(kit, { h, w }) {
  const horizontal = w >= h;
  const long = horizontal ? w : h;
  const across = horizontal ? h : w;
  const box = (u, v, hu, hv, z0, z1, look, g = 'box') =>
    horizontal
      ? kit.slab(u, v, hu, hv, z0, z1, look, 0, g)
      : kit.slab(v, u, hv, hu, z0, z1, look, 0, g);
  const point = (u, v) => (horizontal ? [u, v] : [v, u]);
  return { across, box, horizontal, long, point };
}

const axisSize = (point, hu, hv) => {
  const [hw, hh] = point(hu, hv);
  return { hh, hw };
};

const LEVEL_LED = (u) => {
  if (u > 0.88) return 0;
  if (u > 0.7) return 2;
  return 1;
};

export function buildFader(kit, size) {
  const { rng, style } = kit;
  const { box, long, point } = axisKit(kit, size);
  const reach = long / 2 - 0.2;
  const ticks = [];
  for (let u = -reach, i = 0; u <= reach + 1e-6; u += 0.2, i += 1) {
    const major = i % 4 === 0;
    [-1, 1].forEach((side) =>
      ticks.push(
        box(
          u,
          side * (major ? 0.17 : 0.15),
          0.006,
          major ? 0.05 : 0.03,
          0,
          INK,
          style.legend
        )
      )
    );
  }
  const capLook = rng() < 0.5 ? style.grip : style.cap(Math.floor(rng() * 3));
  return {
    statics: [
      box(0, 0, reach + 0.05, 0.035, 0, 0.003, style.hole),
      ...ticks,
      ...kit.legend(-reach, -0.4, 0.5, 0.03, { align: 'left' }),
    ],
    hits: [slide(0, point(-reach, 0), point(reach, 0), 0.25)],
    signals: ['smooth'],
    pose: ([v]) => {
      const u = (v - 0.5) * 2 * reach;
      return [
        box(u, 0, 0.08, 0.22, 0, 0.17, capLook, 'rbox'),
        box(u, 0, 0.081, 0.014, 0.17, 0.17 + INK, style.legend),
      ];
    },
  };
}

export function buildFaderBank(kit, { h, w }) {
  const { rng, slab, style } = kit;
  const count = Math.max(2, Math.floor((w - 0.2) / 0.38));
  const pitch = (w - 0.3) / count;
  const reach = h / 2 - 0.35;
  const capIndex = Math.floor(rng() * 3);
  const xs = Array.from(
    { length: count },
    (_, i) => -w / 2 + 0.15 + pitch * (i + 0.5)
  );
  const rails = [];
  for (let y = -reach, i = 0; y <= reach + 1e-6; y += 0.2, i += 1) {
    rails.push(kit.ink(0, y, w / 2 - 0.15, i % 3 === 0 ? 0.006 : 0.003));
  }
  return {
    statics: [
      ...rails,
      ...xs.map((x) =>
        slab(x, 0, 0.035, reach + 0.05, INK, INK + 0.003, style.hole)
      ),
      ...xs.flatMap((x) => kit.legend(x, -h / 2 + 0.16, pitch * 0.6, 0.025)),
    ],
    hits: xs.map((x, i) => slide(i, [x, -reach], [x, reach], 0.15)),
    signals: xs.map(() => 'smooth'),
    pose: (values) =>
      xs.flatMap((x, i) => {
        const y = (values[i] - 0.5) * 2 * reach;
        return [
          slab(x, y, 0.1, 0.07, 0, 0.14, style.cap(capIndex), 0, 'rbox'),
          slab(x, y, 0.1, 0.012, 0.14, 0.14 + INK, style.legend),
        ];
      }),
  };
}

export function buildMeter(kit, size) {
  const { style } = kit;
  const { across, box, long, point } = axisKit(kit, size);
  const channels = across >= 1 ? 2 : 1;
  const count = Math.floor((long - 0.3) / 0.07);
  const start = -(count - 1) * 0.035;
  const rows = channels === 2 ? [-0.09, 0.09] : [0];
  return {
    statics: [
      box(0, 0, long / 2 - 0.08, 0.25, 0, 0.02, style.glass, 'rbox'),
      ...kit.legend(-long / 2 + 0.1, -0.38, 0.4, 0.03, { align: 'left' }),
    ],
    hits: rows.map((v, row) =>
      slide(row, point(start, v), point(-start, v), 0.08)
    ),
    signals: rows.map(() => 'audio'),
    pose: (values) =>
      rows.flatMap((v, row) =>
        Array.from({ length: count }, (_, i) => {
          const u = i / Math.max(count - 1, 1);
          const lit = u < values[row] ? 1 : 0;
          return box(
            start + i * 0.07,
            v,
            0.026,
            0.06,
            0.02,
            0.028,
            style.led(LEVEL_LED(u), lit)
          );
        })
      ),
  };
}

export function buildButtonRow(kit, size) {
  const { rng, style } = kit;
  const { box, long, point } = axisKit(kit, size);
  const count = Math.max(2, Math.floor((long - 0.06) / 0.44));
  const pitch = (long - 0.06) / count;
  const group = count >= 8 ? 4 : 1;
  const offset = Math.floor(rng() * 3);
  const pattern = Array.from({ length: count }, () => (rng() < 0.35 ? 1 : 0));
  const us = Array.from(
    { length: count },
    (_, i) => -long / 2 + 0.03 + pitch * (i + 0.5)
  );
  return {
    live: true,
    statics: us.flatMap((u, i) => {
      const look = style.cap(Math.floor(i / group) + offset);
      return [
        box(u, -0.06, 0.19, 0.31, 0, 0.003, style.hole),
        box(u, -0.04, 0.17, 0.28, 0, 0.06, look, 'rbox'),
        box(u, -0.14, 0.17, 0.18, 0, 0.11, look, 'rbox'),
      ];
    }),
    hits: us.map((u, i) =>
      press(i, ...point(u, -0.06), axisSize(point, 0.19, 0.31))
    ),
    signals: pattern.map((base) => ({ base, fixed: true, kind: 'switch' })),
    pose: (values, { step }) =>
      us.map((u, i) => {
        const on = values[i] > 0.5;
        const level = (step % count === i ? 0.6 : 0) + on * 0.4;
        return box(u, 0.33, 0.04, 0.04, 0, 0.03, style.led(0, level), 'cyl');
      }),
  };
}

export function buildKeypad(kit, { h, w }) {
  const { rng, slab, style } = kit;
  const cols = Math.min(4, Math.max(2, Math.floor(w / 0.55)));
  const rows = Math.min(5, Math.max(2, Math.floor(h / 0.55)));
  const pitch = Math.min((w - 0.3) / cols, (h - 0.3) / rows);
  const keys = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      keys.push([(c - (cols - 1) / 2) * pitch, ((rows - 1) / 2 - r) * pitch]);
    }
  }
  const look = rng() < 0.5 ? style.cap(2) : style.grip;
  const ink = rng() < 0.5 ? style.legend : style.ink(false);
  const keyAt = ([x, y], top) => [
    slab(x, y, pitch * 0.38, pitch * 0.38, 0, top, look, 0, 'rbox'),
    ...kit
      .greek(x, y, pitch * 0.25, pitch * 0.09, { z0: top })
      .map((item) => ({ ...item, c: ink.c })),
  ];
  const up = keys.map((key) => keyAt(key, 0.1));
  const down = up.map((parts) => placeAll(parts, { offset: [0, 0, -0.04] }));
  const deep = up.map((parts) => placeAll(parts, { offset: [0, 0, -0.07] }));
  return {
    statics: [
      slab(
        0,
        0,
        (cols * pitch) / 2 + 0.05,
        (rows * pitch) / 2 + 0.05,
        0,
        0.003,
        style.hole
      ),
    ],
    hits: keys.map(([x, y], i) =>
      latch(
        1,
        x,
        y,
        { hh: pitch * 0.42, hw: pitch * 0.42 },
        (i + 1) / keys.length
      )
    ),
    signals: ['smooth', { base: 0, fixed: true, kind: 'smooth' }],
    pose: ([v, hand]) => {
      const pressed = Math.min(keys.length - 1, Math.floor(v * keys.length));
      const held = Math.round(hand * keys.length) - 1;
      return keys.flatMap((key, i) => {
        if (i === held) return deep[i];
        return i === pressed ? down[i] : up[i];
      });
    },
  };
}

const BLACK_AFTER = [true, true, false, true, true, true, false];

export function buildPiano(kit, { h, w }) {
  const { slab, style } = kit;
  const whites = Math.floor((w - 0.2) / 0.24);
  const pitch = (w - 0.2) / whites;
  const length = Math.min(h - 0.25, 1.4);
  const cy = h / 2 - 0.1 - length / 2;
  const by = h / 2 - 0.1 - length * 0.3;
  const ivory = { c: [0.8, 0.78, 0.72], m: 0, r: 0.35, w: 0.6 };
  const ebony = { c: [0.012, 0.012, 0.012], m: 0, r: 0.25 };
  const keys = [];
  for (let i = 0; i < whites; i += 1) {
    const x = -w / 2 + 0.1 + pitch * (i + 0.5);
    keys.push({
      hh: length / 2,
      hw: pitch * 0.46,
      look: ivory,
      top: 0.09,
      x,
      y: cy,
    });
    if (BLACK_AFTER[i % 7] && i < whites - 1) {
      keys.push({
        hh: length * 0.3,
        hw: pitch * 0.28,
        look: ebony,
        top: 0.15,
        x: x + pitch / 2,
        y: by,
      });
    }
  }
  return {
    hits: keys.map((key, i) =>
      latch(i, key.x, key.y, { hh: key.hh, hw: key.hw })
    ),
    live: true,
    statics: [
      slab(0, cy, w / 2 - 0.05, length / 2 + 0.04, 0, 0.01, style.hole),
    ],
    signals: keys.map(() => ({ base: 0, fixed: true, kind: 'switch' })),
    pose: (values, { audio, step }) =>
      keys.map((key, i) => {
        const played =
          audio[(i * 5) % audio.length] > 0.72 &&
          hash01(i, Math.floor(step / 2)) < 0.4;
        const sink = (values[i] > 0.5 && 0.05) || (played && 0.03) || 0;
        return slab(
          key.x,
          key.y,
          key.hw,
          key.hh,
          0.01,
          key.top - sink,
          key.look,
          0,
          'rbox'
        );
      }),
  };
}
