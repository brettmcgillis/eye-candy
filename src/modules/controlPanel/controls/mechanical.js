import { detent, press } from '../hits';
import { TAU, part, placeAll, quatMul, quatX, quatY } from '../parts';
import { textParts } from './glyphs';

export function buildDipSwitches(kit, { k = 1, x = 0, y = 0, variant }) {
  const { slab, style, rng } = kit;
  let count = rng() < 0.5 ? 4 : 6;
  if (variant === 'four') count = 4;
  if (variant === 'six') count = 6;
  const pitch = (0.7 * k) / count;
  const at = (i) => x + (i - (count - 1) / 2) * pitch;
  const statics = [
    slab(x, y, 0.41 * k, 0.25 * k, 0, 0.065 * k, style.cap(0), 0, 'rbox'),
  ];
  for (let i = 0; i < count; i += 1) {
    statics.push(
      slab(at(i), y, pitch * 0.36, 0.17 * k, 0.065 * k, 0.07 * k, style.hole)
    );
    statics.push(
      ...textParts(
        kit,
        String(i + 1),
        at(i) - 0.024 * k,
        y - 0.29 * k,
        0.016 * k,
        0.004 * k,
        style.legend
      )
    );
  }
  return {
    statics,
    hits: Array.from({ length: count }, (_, i) =>
      press(i, at(i), y, { hw: pitch * 0.45, hh: 0.2 * k })
    ),
    signals: Array.from({ length: count }, () => ({
      kind: 'switch',
      fixed: true,
      base: rng() < 0.5 ? 0 : 1,
    })),
    pose: (values) =>
      values.map((v, i) =>
        slab(
          at(i),
          y + (v > 0.5 ? 0.09 : -0.09) * k,
          pitch * 0.29,
          0.065 * k,
          0.07 * k,
          0.11 * k,
          style.metal
        )
      ),
  };
}

export function buildThumbwheel(kit, { k = 1, x = 0, y = 0 }) {
  const { slab, style, rng } = kit;
  const radius = 0.27 * k;
  const z = 0.045 * k;
  const wheel = [
    part(
      'knurl',
      [0, 0, 0],
      [radius, radius, 0.13 * k],
      style.knob,
      quatY(Math.PI / 2)
    ),
  ];
  for (let digit = 0; digit < 10; digit += 1) {
    wheel.push(
      ...placeAll(
        textParts(
          kit,
          String(digit),
          -0.045 * k,
          0.075 * k,
          0.03 * k,
          radius,
          style.legend
        ),
        { q: quatX((digit * TAU) / 10) }
      )
    );
  }
  return {
    statics: [
      slab(x, y, 0.26 * k, 0.4 * k, 0, z, style.rubber, 0, 'rbox'),
      ...[-1, 1].flatMap((sign) => [
        slab(
          x + sign * 0.2 * k,
          y,
          0.055 * k,
          0.36 * k,
          z,
          0.32 * k,
          style.brushed
        ),
        slab(
          x,
          y + sign * 0.235 * k,
          0.15 * k,
          0.145 * k,
          z,
          0.31 * k,
          style.knob
        ),
      ]),
    ],
    hits: [detent(0, x, y, 0.31 * k, 10)],
    signals: [
      {
        kind: 'step',
        fixed: true,
        steps: 10,
        base: Math.floor(rng() * 10) / 9,
      },
    ],
    pose: ([v]) =>
      placeAll(wheel, {
        offset: [x, y, z],
        q: quatX((-Math.round(v * 9) * TAU) / 10),
      }),
  };
}

export function buildTrackball(kit, { k = 1, x = 0, y = 0 }) {
  const { disc, style } = kit;
  const radius = 0.29 * k;
  const ball = [
    part('sphere', [0, 0, 0], [radius, radius, radius], style.cap(1)),
  ];
  for (let i = 0; i < 3; i += 1) {
    ball.push(
      part(
        'torus',
        [0, 0, 0],
        [radius * 1.003, radius * 1.003, 0.006 * k],
        style.metal,
        [quatX(Math.PI / 2), quatY(Math.PI / 2), quatX(0)][i]
      )
    );
  }
  ball.push(
    part(
      'sphere',
      [0, 0, radius],
      [0.025 * k, 0.025 * k, 0.006 * k],
      style.legend
    )
  );
  return {
    statics: [
      disc(x, y, 0.41 * k, 0, 0.025 * k, style.brushed),
      disc(x, y, 0.33 * k, 0.025 * k, 0.04 * k, style.hole),
    ],
    hits: [{ kind: 'ball', signals: [0, 1], x, y, r: 0.32 * k }],
    signals: ['smooth', 'smooth'],
    pose: ([u, v]) =>
      placeAll(ball, {
        offset: [x, y, 0.035 * k],
        q: quatMul(quatX(-v * TAU), quatY(u * TAU)),
      }),
  };
}
