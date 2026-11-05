import { slide } from '../hits';
import { part, placeAll, quatX, quatY } from '../parts';

const HOUSING_Z = 0.06;

// An airliner's thrust lever: one crossbar handle on two legs that swing
// out of slots in a rounded quadrant housing.
function buildAirliner(kit, { w, h }) {
  const { slab, style } = kit;
  const reach = Math.min(0.85, (h - 0.65) / 1.3);
  const travel = reach * Math.sin(0.65);
  const radius = Math.min(0.32, reach * 0.45);
  const half = w / 2 - 0.3;
  const legX = half * 0.62;
  const z = HOUSING_Z;
  const across = (x, r, length, look) =>
    part('cyl', [x, 0, 0], [r, r, length], look, quatY(Math.PI / 2));
  const lever = [
    ...[-1, 1].map((side) =>
      part(
        'cyl',
        [side * legX, 0, reach / 2],
        [0.03, 0.03, reach / 2],
        style.metal
      )
    ),
    part(
      'cyl',
      [0, 0, reach],
      [0.055, 0.055, legX + 0.07],
      style.cap(0),
      quatY(Math.PI / 2)
    ),
    ...[-1, 1].map((side) =>
      part(
        'sphere',
        [side * (legX + 0.07), 0, reach],
        [0.065, 0.065, 0.065],
        style.cap(0)
      )
    ),
  ];
  const housing = placeAll(
    [
      across(0, radius, half, style.knob),
      ...[-1, 1].map((side) =>
        across(side * legX, radius + 0.004, 0.045, style.hole)
      ),
      ...[-1, 1].map((side) =>
        across(side * (half + 0.02), radius * 0.55, 0.02, style.brushed)
      ),
    ],
    { offset: [0, 0, z] }
  );
  return {
    statics: [
      slab(0, 0, w / 2 - 0.12, h / 2 - 0.12, 0, z, style.knob, 0, 'rbox'),
      ...housing,
      ...Array.from({ length: 7 }, (_, n) =>
        slab(
          half * 0.92 + 0.12,
          (n / 6 - 0.5) * travel * 2,
          0.05,
          0.005,
          z,
          z + 0.004,
          style.legend
        )
      ),
      ...kit.legend(0, -(travel + 0.25), w * 0.4, 0.03, { z0: z }),
    ],
    hits: [slide(0, [0, -travel], [0, travel], legX + 0.12)],
    signals: ['smooth'],
    pose: ([value]) =>
      placeAll(lever, { offset: [0, 0, z], q: quatX((0.5 - value) * 1.3) }),
  };
}

export default function buildThrottle(kit, { w, h, variant }) {
  const { slab, style, rng } = kit;
  const roll = rng();
  if (variant === 'airliner' || (!variant && roll < 0.25))
    return buildAirliner(kit, { h, w });
  let count = roll < 0.5 ? 2 : 3;
  if (variant === 'pair') count = 2;
  if (variant === 'triple') count = 3;
  const pitch = (w - 0.5) / count;
  const reach = Math.min(0.85, (h - 0.65) / 1.3);
  const travel = reach * Math.sin(0.65);
  const at = (i) => (i - (count - 1) / 2) * pitch;
  const arms = Array.from({ length: count }, (_, i) => [
    part('cyl', [0, 0, reach / 2], [0.028, 0.028, reach / 2], style.metal),
    part('rbox', [0, 0, reach], [pitch * 0.28, 0.095, 0.085], style.cap(i)),
    part(
      'cyl',
      [0, 0, 0],
      [0.1, 0.1, pitch * 0.28],
      style.brushed,
      quatY(Math.PI / 2)
    ),
  ]);
  return {
    statics: [
      slab(0, 0, w / 2 - 0.12, h / 2 - 0.12, 0, 0.06, style.knob, 0, 'rbox'),
      ...arms.flatMap((_, i) => [
        slab(
          at(i),
          0,
          0.065,
          travel + 0.15,
          0.06,
          0.065,
          style.hole,
          0,
          'rbox'
        ),
        ...Array.from({ length: 7 }, (v, n) =>
          slab(
            at(i) + pitch * 0.34,
            (n / 6 - 0.5) * travel * 2,
            0.04,
            0.005,
            0.065,
            0.069,
            style.legend
          )
        ),
      ]),
    ],
    hits: arms.map((_, i) =>
      slide(i, [at(i), -travel], [at(i), travel], pitch * 0.3)
    ),
    signals: arms.map(() => 'smooth'),
    pose: (values) =>
      arms.flatMap((arm, i) =>
        placeAll(arm, {
          offset: [at(i), 0, 0.09],
          q: quatX((0.5 - values[i]) * 1.3),
        })
      ),
  };
}
