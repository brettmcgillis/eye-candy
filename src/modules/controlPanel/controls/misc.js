import { SQUARES_H } from '@utils/argylePattern';

import { stick } from '../hits';
import { DEG, part, placeAll, quatMul, quatX, quatY } from '../parts';

export function buildJoystick(kit, { h, variant, w }) {
  const { disc, rng, style } = kit;
  const s = Math.min(w, h) / 2;
  const rolledHandle = rng() < 0.5;
  const handle = variant ? variant === 'handle' : rolledHandle;
  const shaft = [
    part('cyl', [0, 0, 0.3 * s], [0.04 * s, 0.04 * s, 0.3 * s], style.metal),
    handle
      ? part('rbox', [0, 0, 0.7 * s], [0.1 * s, 0.13 * s, 0.14 * s], style.knob)
      : part(
          'sphere',
          [0, 0, 0.64 * s],
          [0.12 * s, 0.12 * s, 0.12 * s],
          style.cap(0)
        ),
  ];
  return {
    statics: [
      kit.slab(0, 0, 0.86 * s, 0.86 * s, 0, 0.008 * s, style.knob, 0, 'rbox'),
      ...[-1, 1].flatMap((sx) =>
        [-1, 1].flatMap((sy) =>
          kit.screw(sx * 0.72 * s, sy * 0.72 * s, 0.04 * s, 0.008 * s)
        )
      ),
      part(
        'torus',
        [0, 0, 0.02 * s],
        [0.55 * s, 0.55 * s, 0.03 * s],
        style.brushed
      ),
      disc(0, 0, 0.52 * s, 0, 0.01 * s, style.rubber),
      disc(0, 0, 0.36 * s, 0.01 * s, 0.14 * s, style.rubber, 'cap'),
      ...kit.legend(0, -0.7 * s, 0.4 * s, 0.035 * s, { z0: 0.008 * s }),
    ],
    hits: [stick([0, 1], 0, 0, 0.5 * s)],
    signals: ['smooth', 'smooth'],
    pose: ([a, b]) => {
      const q = quatMul(
        quatX((0.5 - b) * 40 * DEG),
        quatY((a - 0.5) * 40 * DEG)
      );
      return placeAll(shaft, { offset: [0, 0, 0.1 * s], q });
    },
  };
}

export function buildBlank(kit, { h, variant, w }) {
  const { rng, slab, style } = kit;
  const statics = [];
  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sy) =>
      statics.push(...kit.screw(sx * (w / 2 - 0.15), sy * (h / 2 - 0.15)))
    )
  );
  const rolled = rng();
  let kind = rolled < 0.75 ? 'vent' : 'plain';
  if (rolled < 0.4 && w >= 2) kind = 'plate';
  if (variant) kind = variant;
  if (kind === 'plate') {
    statics.push(
      slab(
        0,
        0,
        w / 2 - 0.35,
        Math.min(h / 2 - 0.3, 0.22),
        0,
        0.012,
        style.brushed,
        0,
        'rbox'
      )
    );
    statics.push(
      ...kit.greek(0, 0.05, w - 1, 0.05, { z0: 0.012 }),
      ...kit.greek(0, -0.07, w * 0.5, 0.03, { z0: 0.012 })
    );
  } else if (kind === 'vent') {
    for (let y = -h / 2 + 0.35; y <= h / 2 - 0.34; y += 0.14) {
      statics.push(
        slab(0, y, w / 2 - 0.35, 0.03, 0, 0.003, style.hole, 0, 'rbox')
      );
    }
  }
  return { statics, signals: [], pose: null };
}

// The maker's nameplate: a riveted brushed plate carrying the house mark
// and a greeked wordmark. The mark is the argyle (@utils/argylePattern)
// cut to its centre square, filled and a hair oversize, under its four
// half-offset squares in outline, all turned 45° into diamonds.
const LOGO = SQUARES_H.filter(({ i, layer }) => layer === 't' || i === 0);
const LOGO_INK = { c: [0.012, 0.012, 0.012], m: 0, r: 0.5 };
const CENTER = 0.7;
const OUTLINE = 0.16;

export function buildBadge(kit, { h, w }) {
  const { disc, greek, ink, slab, style } = kit;
  const hw = w / 2 - 0.16;
  const hh = Math.min(h / 2 - 0.16, hw * 0.6);
  const z = 0.035;
  const engraved = (item) => ({ ...item, c: style.hole.c });
  const mark = Math.min(hh * 1.5, hw * 0.55);
  const mx = -hw + mark * 0.32 + 0.1;
  const statics = [slab(0, 0, hw, hh, 0, z, style.brushed, 0, 'rbox')];
  const unit = mark * 0.18;
  const toPlate = (sx, sy) => [
    mx + (sx - sy) * Math.SQRT1_2 * unit,
    (sx + sy) * Math.SQRT1_2 * unit,
  ];
  const diamond = (sx, sy, hx, hy, look) =>
    ink(...toPlate(sx, sy), hx * unit, hy * unit, 45 * DEG, z, look);
  LOGO.forEach(({ layer, sx, sy }) => {
    if (layer === 'b') {
      statics.push(diamond(sx, sy, CENTER, CENTER, LOGO_INK));
      return;
    }
    const edge = 0.5 - OUTLINE / 2;
    statics.push(
      diamond(sx - edge, sy, OUTLINE / 2, 0.5, LOGO_INK),
      diamond(sx + edge, sy, OUTLINE / 2, 0.5, LOGO_INK),
      diamond(sx, sy - edge, 0.5, OUTLINE / 2, LOGO_INK),
      diamond(sx, sy + edge, 0.5, OUTLINE / 2, LOGO_INK)
    );
  });
  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sy) =>
      statics.push(
        disc(sx * (hw - 0.1), sy * (hh - 0.1), 0.025, z, z + 0.012, style.metal)
      )
    )
  );
  const words = mx + mark * 0.32 + 0.1;
  const span = hw - words - 0.08;
  statics.push(
    ...greek(words, hh * 0.18, span, hh * 0.22, { align: 'left', z0: z }).map(
      engraved
    ),
    ...greek(words, -hh * 0.3, span * 0.7, hh * 0.1, {
      align: 'left',
      z0: z,
    }).map(engraved)
  );
  return { statics, signals: [], pose: null };
}
