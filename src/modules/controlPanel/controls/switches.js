import { press } from '../hits';
import { INK } from '../kit';
import { DEG, part, placeAll, quatX, quatY } from '../parts';

const YELLOW = { c: [0.95, 0.62, 0.02], m: 0, r: 0.45 };
const RED = { c: [0.75, 0.03, 0.02], m: 0, r: 0.3 };

const tilt = (parts, x, y, z, angle) =>
  placeAll(parts, { offset: [x, y, z], q: quatX(angle) });

export function buildButton(kit, { k = 1, variant, x = 0, y = 0 }) {
  const { disc, rng, slab, style } = kit;
  const rolledRound = rng() < 0.4;
  const rolledLit = rng() < 0.3;
  const round = variant
    ? variant === 'round' || variant === 'round-lit'
    : rolledRound;
  const lit = variant
    ? variant === 'lit' || variant === 'round-lit'
    : rolledLit;
  const capIndex = Math.floor(rng() * 3);
  const ledIndex = Math.floor(rng() * 3);
  const by = y - 0.06 * k;
  const bezel = round
    ? disc(x, by, 0.27 * k, 0, 0.004, style.hole)
    : slab(x, by, 0.27 * k, 0.27 * k, 0, 0.004, style.hole);
  return {
    statics: [bezel, ...kit.legend(x, y - 0.42 * k, 0.34 * k, 0.03 * k)],
    hits: [press(0, x, y - 0.06 * k, { hh: 0.27 * k, hw: 0.27 * k })],
    signals: ['switch'],
    pose: ([v]) => {
      const on = v > 0.5;
      const look = lit
        ? style.lit(style.capColor(capIndex), on ? 0.6 : 0.03)
        : style.cap(capIndex);
      const top = (on ? 0.09 : 0.12) * k;
      const cap = round
        ? disc(x, by, 0.21 * k, 0, top, look, 'cap')
        : slab(x, by, 0.21 * k, 0.21 * k, 0, top, look, 0, 'rbox');
      return lit
        ? [cap]
        : [cap, ...kit.led(x, y + 0.33 * k, 0.04 * k, ledIndex, on ? 1 : 0)];
    },
  };
}

export function buildToggle(kit, { domain, k = 1, variant, x = 0, y = 0 }) {
  const { disc, rng, style } = kit;
  const rolledGuard = rng() < (domain === 'cockpit' ? 0.45 : 0.1);
  const guarded = variant ? variant === 'guarded' : rolledGuard;
  const bat = [
    part('cap', [0, 0, 0.1 * k], [0.035 * k, 0.035 * k, 0.1 * k], style.metal),
    part(
      'sphere',
      [0, 0, 0.21 * k],
      [0.045 * k, 0.045 * k, 0.045 * k],
      style.metal
    ),
  ];
  // A hollow flip guard: two cheeks, a lid and a lip, hinged along its top
  // edge on a bed, so it clears the bat closed and lifts up and back open.
  const span = 0.6 * k;
  const tall = 0.34 * k;
  const half = 0.15 * k;
  const skin = 0.02 * k;
  const hingeY = y + 0.3 * k;
  const bedTop = 0.025 * k;
  const cover = [
    ...[-1, 1].map((side) =>
      part(
        'rbox',
        [side * (half - skin / 2), -span / 2, tall / 2],
        [skin / 2, span / 2, tall / 2],
        RED
      )
    ),
    part(
      'rbox',
      [0, -span / 2, tall - skin / 2],
      [half, span / 2, skin / 2],
      RED
    ),
    part(
      'rbox',
      [0, -span + skin / 2, tall / 2],
      [half, skin / 2, tall / 2],
      RED
    ),
  ];
  const bed = guarded
    ? [
        kit.slab(
          x,
          hingeY - span / 2,
          half + 0.04 * k,
          span / 2 + 0.05 * k,
          0,
          bedTop,
          style.rubber,
          0,
          'rbox'
        ),
        part(
          'cyl',
          [x, hingeY, bedTop],
          [0.03 * k, 0.03 * k, half + 0.02 * k],
          style.metal,
          quatY(Math.PI / 2)
        ),
      ]
    : [];
  return {
    statics: [
      ...bed,
      disc(x, y, 0.13 * k, 0, 0.015 * k, style.brushed),
      disc(x, y, 0.08 * k, 0.015 * k, 0.07 * k, style.metal, 'knurl'),
      ...kit.legend(x, y + 0.38 * k, 0.3 * k, 0.03 * k),
      ...kit.legend(x, y - 0.38 * k, 0.3 * k, 0.03 * k),
    ],
    // Guarded, the lid is its own control and the bat can only be reached
    // with it open; shutting the lid holds the bat down.
    hits: guarded
      ? [
          press(1, x, hingeY - span / 2, {
            hh: span / 2 + 0.05 * k,
            hw: half + 0.04 * k,
          }),
          {
            ...press(0, x, y, { r: 0.12 * k }),
            requires: { above: 0.5, signal: 1 },
          },
        ]
      : [press(0, x, y, { r: 0.3 * k })],
    signals: guarded
      ? ['switch', { base: 0, fixed: true, kind: 'switch' }]
      : ['switch'],
    pose: ([v, lid = 1]) => {
      const open = lid > 0.5;
      const up = open && v > 0.5;
      const parts = tilt(bat, x, y, 0.06 * k, (up ? -28 : 28) * DEG);
      if (!guarded) return parts;
      return [
        ...parts,
        ...tilt(cover, x, hingeY, bedTop, (open ? -100 : 0) * DEG),
      ];
    },
  };
}

export function buildRocker(kit, { k = 1, x = 0, y = 0 }) {
  const { rng, slab, style } = kit;
  const capIndex = Math.floor(rng() * 3);
  const body = [
    part('rbox', [0, 0, 0], [0.13 * k, 0.22 * k, 0.06 * k], style.knob),
  ];
  return {
    statics: [
      slab(x, y, 0.17 * k, 0.26 * k, 0, 0.03 * k, style.rubber, 0, 'rbox'),
      ...kit.legend(x, y - 0.4 * k, 0.3 * k, 0.03 * k),
    ],
    hits: [press(0, x, y, { hh: 0.26 * k, hw: 0.17 * k })],
    signals: ['switch'],
    pose: ([v]) => {
      const on = v > 0.5;
      return [
        ...tilt(body, x, y, 0.06 * k, (on ? 9 : -9) * DEG),
        slab(
          x,
          y + 0.12 * k,
          0.09 * k,
          0.04 * k,
          0.12 * k,
          0.125 * k,
          style.lit(style.capColor(capIndex), on ? 0.7 : 0.02)
        ),
      ];
    },
  };
}

export function buildKeyswitch(kit, { k = 1, x = 0, y = 0 }) {
  const { disc, slab, style } = kit;
  return {
    statics: [
      disc(x, y, 0.2 * k, 0, 0.05 * k, style.metal),
      disc(x, y, 0.12 * k, 0.05 * k, 0.06 * k, style.brushed),
      kit.ink(x - 0.27 * k, y + 0.12 * k, 0.04 * k, 0.012 * k, -45 * DEG),
      kit.ink(x + 0.27 * k, y + 0.12 * k, 0.04 * k, 0.012 * k, 45 * DEG),
    ],
    hits: [press(0, x, y, { r: 0.22 * k })],
    signals: ['switch'],
    pose: ([v]) => [
      slab(
        x,
        y,
        0.016 * k,
        0.08 * k,
        0.06 * k,
        0.065 * k,
        style.hole,
        v > 0.5 ? -45 * DEG : 45 * DEG
      ),
    ],
  };
}

export function buildJack(kit, { k = 1, variant, x = 0, y = 0 }) {
  const { disc, rng, style } = kit;
  let family = variant;
  if (!['quarter', 'eighth'].includes(family))
    family = rng() < 0.5 ? 'quarter' : 'eighth';
  const size = (family === 'quarter' ? 1.3 : 0.65) * k;
  return {
    statics: [
      disc(x, y, 0.15 * size, 0, 0.06 * size, style.metal, 'knurl'),
      disc(x, y, 0.095 * size, 0.06 * size, 0.075 * size, style.brushed),
      disc(x, y, 0.07 * size, 0.075 * size, 0.075 * size + INK, style.hole),
      ...kit.legend(x, y + 0.32 * k, 0.3 * k, 0.03 * k),
    ],
    sockets: [{ family, p: [x, y, 0.075 * size], scale: size }],
    signals: [],
    pose: null,
  };
}

export function buildAnnunciator(kit, { k = 1, x = 0, y = 0 }) {
  const { rng, slab, style } = kit;
  const colorIndex = Math.floor(rng() * 3);
  const words = kit.greek(x, y + 0.04 * k, 0.26 * k, 0.04 * k, {
    z0: 0.06 * k,
  });
  const second = kit.greek(x, y - 0.07 * k, 0.2 * k, 0.04 * k, {
    z0: 0.06 * k,
  });
  const ink = [...words, ...second].map((item) => ({
    ...item,
    c: [0.01, 0.01, 0.01],
  }));
  return {
    statics: [
      slab(x, y, 0.4 * k, 0.28 * k, 0, 0.03 * k, style.rubber, 0, 'rbox'),
      ...ink,
    ],
    hits: [press(0, x, y, { hh: 0.28 * k, hw: 0.4 * k })],
    signals: ['switch'],
    pose: ([v]) => [
      slab(
        x,
        y,
        0.34 * k,
        0.22 * k,
        0.03 * k,
        0.06 * k,
        style.lit(style.ledColor(colorIndex), v > 0.5 ? 0.8 : 0.02),
        0,
        'rbox'
      ),
    ],
  };
}

export function buildLeds(kit, { k = 1, x = 0, y = 0 }) {
  const { rng } = kit;
  const count = 2 + Math.floor(rng() * 3);
  const colors = Array.from({ length: count }, () => Math.floor(rng() * 3));
  const span = 0.6 * k;
  const at = (i) =>
    x - span / 2 + (count > 1 ? (span * i) / (count - 1) : span / 2);
  return {
    statics: colors.flatMap((_, i) =>
      kit.legend(at(i), y - 0.16 * k, 0.12 * k, 0.025 * k)
    ),
    hits: colors.map((_, i) => press(i, at(i), y + 0.06 * k, { r: 0.1 * k })),
    signals: colors.map(() => 'switch'),
    pose: (values) =>
      colors.flatMap((index, i) =>
        kit.led(at(i), y + 0.06 * k, 0.055 * k, index, values[i] > 0.5 ? 1 : 0)
      ),
  };
}

export function buildEStop(kit, { k = 1, x = 0, y = 0 }) {
  const { disc } = kit;
  return {
    statics: [
      disc(x, y, 0.44 * k, 0, 0.02 * k, YELLOW),
      ...kit
        .greek(x, y - 0.38 * k, 0.3 * k, 0.03 * k, { z0: 0.02 * k })
        .map((item) => ({ ...item, c: [0.01, 0.01, 0.01] })),
      disc(x, y, 0.2 * k, 0.02 * k, 0.1 * k, kit.style.knob),
    ],
    hits: [press(0, x, y, { r: 0.34 * k })],
    signals: ['switch'],
    pose: ([v]) => {
      const top = (v > 0.5 ? 0.16 : 0.22) * k;
      return [disc(x, y, 0.32 * k, top - 0.08 * k, top, RED, 'cap')];
    },
  };
}
