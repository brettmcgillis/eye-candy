import { detent, dial } from '../hits';
import { INK, SWEEP, pointerAngle } from '../kit';
import { DEG, TAU, part, placeAll, quatZ, rot2 } from '../parts';

const KNOBS = ['skirt', 'chicken', 'knurl', 'davies', 'flush'];

export const spin = (parts, x, y, angle) =>
  placeAll(parts, { offset: [x, y, 0], q: quatZ(angle) });

// One knob of radius-scale `k` at the origin, pointer up, so posing it is a
// single rotation.
export function knobBody(kit, k, variant, capIndex) {
  const { disc, slab, style } = kit;
  const cap = style.cap(capIndex);
  const line = (y, hh, z) =>
    slab(0, y, 0.012 * k, hh, z, z + INK, style.legend);
  if (variant === 'chicken') {
    return [
      disc(0, 0, 0.14 * k, 0, 0.12 * k, style.grip),
      slab(0, 0.06 * k, 0.06 * k, 0.22 * k, 0, 0.09 * k, style.grip, 0, 'rbox'),
      line(0.18 * k, 0.08 * k, 0.09 * k),
    ];
  }
  if (variant === 'knurl') {
    return [
      disc(0, 0, 0.24 * k, 0, 0.2 * k, style.metal, 'knurl'),
      disc(0, 0, 0.19 * k, 0.2 * k, 0.21 * k, style.brushed),
      disc(0, 0.13 * k, 0.022 * k, 0.21 * k, 0.21 * k + INK, style.hole),
    ];
  }
  if (variant === 'davies') {
    return [
      disc(0, 0, 0.21 * k, 0, 0.28 * k, style.grip, 'cap'),
      disc(0, 0, 0.13 * k, 0.28 * k, 0.29 * k, cap),
      line(0.08 * k, 0.07 * k, 0.29 * k),
    ];
  }
  if (variant === 'flush') {
    return [
      disc(0, 0, 0.26 * k, 0, 0.34 * k, cap, 'cap'),
      line(0.12 * k, 0.08 * k, 0.34 * k),
    ];
  }
  return [
    disc(0, 0, 0.3 * k, 0, 0.05 * k, style.grip),
    slab(
      0,
      0.27 * k,
      0.012 * k,
      0.03 * k,
      0.05 * k,
      0.05 * k + INK,
      style.legend
    ),
    disc(0, 0, 0.22 * k, 0.05 * k, 0.22 * k, cap, 'cap'),
    line(0.1 * k, 0.07 * k, 0.22 * k),
  ];
}

export function buildKnob(kit, { k = 1, variant: forced, x = 0, y = 0 }) {
  const { rng, ticks } = kit;
  const variant = forced ?? KNOBS[Math.floor(rng() * KNOBS.length)];
  const body = knobBody(kit, k, variant, Math.floor(rng() * 3));
  const count = rng() < 0.5 ? 11 : 21;
  return {
    statics: [
      ...ticks({ count, r0: 0.34 * k, r1: 0.39 * k, x, y }),
      ...kit.legend(x, y - 0.45 * k, 0.4 * k, 0.03 * k),
    ],
    hits: [dial(0, x, y, 0.4 * k)],
    signals: ['smooth'],
    pose: ([v]) => spin(body, x, y, pointerAngle(v)),
  };
}

export function buildSelector(kit, { k = 1, x = 0, y = 0 }) {
  const { disc, dots, rng, slab, style } = kit;
  const steps = 3 + Math.floor(rng() * 9);
  const sweep = Math.min(SWEEP, (steps - 1) * 36 * DEG);
  const body = [
    disc(0, 0, 0.14 * k, 0, 0.14 * k, style.knob),
    slab(0, 0.05 * k, 0.05 * k, 0.24 * k, 0, 0.1 * k, style.knob, 0, 'rbox'),
    slab(0, 0.2 * k, 0.01 * k, 0.07 * k, 0.1 * k, 0.1 * k + INK, style.legend),
  ];
  const marks = [];
  for (let i = 0; i < steps; i += 1) {
    const a = steps > 1 ? sweep / 2 - (sweep * i) / (steps - 1) : 0;
    const [dx, dy] = rot2(0, 0.4 * k, a);
    marks.push(kit.ink(x + dx, y + dy, 0.02 * k, 0.012 * k, a));
  }
  return {
    statics: [
      ...dots({
        count: steps,
        from: sweep / 2,
        r: 0.33 * k,
        size: 0.015 * k,
        to: -sweep / 2,
        x,
        y,
      }),
      ...marks,
    ],
    hits: [detent(0, x, y, 0.4 * k, steps)],
    signals: [{ kind: 'step', steps }],
    pose: ([v]) => spin(body, x, y, sweep / 2 - sweep * v),
  };
}

export function buildEncoder(kit, { k = 1, x = 0, y = 0 }) {
  const { disc, rng, style } = kit;
  const lights = 15;
  const ledIndex = Math.floor(rng() * 3);
  const body = [
    disc(0, 0, 0.21 * k, 0, 0.18 * k, style.knob, 'knurl'),
    disc(0, 0.12 * k, 0.02 * k, 0.18 * k, 0.18 * k + INK, style.legend),
  ];
  return {
    statics: kit.legend(x, y - 0.45 * k, 0.36 * k, 0.03 * k),
    hits: [dial(0, x, y, 0.36 * k)],
    signals: ['smooth'],
    pose: ([v]) => {
      const lit = Math.round(v * lights);
      const ring = Array.from({ length: lights }, (_, i) => {
        const a = SWEEP / 2 - (SWEEP * i) / (lights - 1);
        const [dx, dy] = rot2(0, 0.33 * k, a);
        return disc(
          x + dx,
          y + dy,
          0.025 * k,
          0,
          0.012 * k,
          style.led(ledIndex, i < lit ? 1 : 0)
        );
      });
      return [...spin(body, x, y, -v * TAU * 2), ...ring];
    },
  };
}

const GAUGE_GLASS = { c: [0.9, 0.92, 0.95], m: 0, r: 0.05 };

export function buildGauge(kit, { k = 1, variant, x = 0, y = 0 }) {
  const { disc, rng, slab, style, ticks } = kit;
  const rolledDark = rng() < 0.6;
  const dark = variant ? variant === 'dark' : rolledDark;
  const range = (200 + rng() * 70) * DEG;
  const face = style.face(dark);
  const ink = style.ink(dark);
  const z = 0.012 * k;
  const needle = [
    slab(
      0,
      0.13 * k,
      0.01 * k,
      0.2 * k,
      z + 0.01 * k,
      z + 0.016 * k,
      style.lit(style.capColor(0), 0.15)
    ),
    disc(0, 0, 0.04 * k, z, z + 0.03 * k, style.knob),
  ];
  return {
    statics: [
      part(
        'torus',
        [x, y, 0.02 * k],
        [0.42 * k, 0.42 * k, 0.03 * k],
        style.metal
      ),
      disc(x, y, 0.41 * k, 0, z, face),
      part(
        'lens',
        [x, y, 0.047 * k],
        [0.405 * k, 0.405 * k, 0.017 * k],
        GAUGE_GLASS
      ),
      ...ticks({
        count: 7,
        from: range / 2,
        look: ink,
        r0: 0.28 * k,
        r1: 0.37 * k,
        to: -range / 2,
        width: 0.016 * k,
        x,
        y,
        z0: z,
      }),
      ...ticks({
        count: 31,
        from: range / 2,
        look: ink,
        r0: 0.33 * k,
        r1: 0.37 * k,
        to: -range / 2,
        width: 0.006 * k,
        x,
        y,
        z0: z,
      }),
      ...kit
        .greek(x, y - 0.17 * k, 0.16 * k, 0.025 * k, { z0: z })
        .map((item) => ({ ...item, c: ink.c })),
    ],
    hits: [dial(0, x, y, 0.42 * k)],
    signals: [rng() < 0.5 ? 'audio' : 'smooth'],
    pose: ([v]) => spin(needle, x, y, range / 2 - range * v),
  };
}

export function buildBigKnob(kit, { k = 1, x = 0, y = 0 }) {
  const { disc, dots, rng, style } = kit;
  const s = k / 2;
  const blink = 2 ** (3 + 3 * rng());
  const body = [
    disc(0, 0, 0.67 * s, 0, 0.04 * s, style.metal),
    disc(0, 0, 0.62 * s, 0.04 * s, 0.38 * s, style.metal, 'knurl'),
    disc(0, 0, 0.45 * s, 0.38 * s, 0.4 * s, style.brushed),
    disc(0, 0.53 * s, 0.03 * s, 0.38 * s, 0.4 * s, style.hole),
  ];
  return {
    live: true,
    statics: [
      ...dots({
        count: 21,
        from: SWEEP / 2,
        r: 0.74 * s,
        size: 0.015 * s,
        to: -SWEEP / 2,
        x,
        y,
      }),
      ...dots({
        count: 3,
        from: SWEEP / 2,
        r: 0.74 * s,
        size: 0.03 * s,
        to: -SWEEP / 2,
        x,
        y,
      }),
      ...kit.legend(x - 0.55 * s, y - 0.86 * s, 0.4 * s, 0.035 * s),
    ],
    hits: [dial(0, x, y, 0.7 * s)],
    signals: ['smooth'],
    pose: ([v], { t }) => [
      ...spin(body, x, y, pointerAngle(v)),
      ...kit.led(
        x + 0.7 * s,
        y - 0.7 * s,
        0.05 * s,
        0,
        (1 - v) * (0.5 + 0.5 * Math.sin(t * blink))
      ),
    ],
  };
}
