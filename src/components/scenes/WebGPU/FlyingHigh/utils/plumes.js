import splinePath from '@utils/splinePath';

export const PATH_SAMPLES = 24;

// Boeing737 model space (nose +z, y up, unscaled). Each engine's fire bursts
// out of the intake, licks up the front of the cowling and over the wing's
// leading edge, streams aft across the top of the wing and rises up and
// back off the trailing edge as the smoke trail. The wing roots burn
// thinner trails alongside.
// Past the wing (from point 4 on) each trail is shaped by its own `rise`,
// sideways `drift` and aft `stretch`, so the two sides never mirror.
const ENGINE = [
  [4.93, -0.95, 3.25],
  [4.95, -0.1, 3.0],
  [4.92, 0.75, 1.9],
  [4.85, 1.35, -0.6],
  [4.75, 2, -3.8],
  [4.6, 3, -7.4],
  [4.3, 4.8, -11],
  [3.9, 7.4, -14.8],
  [3.5, 10.6, -18.5],
  [3.1, 14, -22],
];
const [, Y0, Z0] = ENGINE[4];
const engine = (s, { drift = 0, rise = 1, stretch = 1 } = {}) =>
  ENGINE.map(([x, y, z], i) => {
    if (i < 4) return [s * x, y, z];
    const k = (i - 4) / (ENGINE.length - 5);
    return [
      s * (x + drift * k * k),
      Y0 + (y - Y0) * rise,
      Z0 + (z - Z0) * stretch,
    ];
  });

const wingRoot = (s) => [
  [s * 2.3, 0.8, -1.5],
  [s * 2.45, 1.5, -3.5],
  [s * 2.7, 2.6, -6.5],
  [s * 3, 4.4, -10],
  [s * 3.2, 7, -14],
];

// `scale` is the trail's width against an engine's; `salt` shifts its
// billows, so no two trails carry the same pattern.
export const PLUMES = [
  {
    key: 'plumeLeftEngine',
    label: 'Left Engine',
    points: engine(-1),
    salt: [0, 0, 0],
  },
  {
    key: 'plumeRightEngine',
    label: 'Right Engine',
    points: engine(1, { drift: 1.2, rise: 0.82, stretch: 1.12 }),
    salt: [0.37, 0.71, 0.19],
  },
  {
    key: 'plumeLeftWing',
    label: 'Left Wing Root',
    points: wingRoot(-1),
    salt: [0.53, 0.29, 0.83],
    scale: 0.6,
  },
  {
    key: 'plumeRightWing',
    label: 'Right Wing Root',
    points: wingRoot(1),
    salt: [0.11, 0.91, 0.47],
    scale: 0.6,
  },
].map((plume) => ({
  scale: 1,
  ...plume,
  path: splinePath(
    plume.points.map(([x, y, z]) => ({ x, y, z })),
    { samples: PATH_SAMPLES }
  ),
}));

// Where each engine's fire lights the cowling and wing, in model space.
export const FIRE_LIGHTS = [
  [-4.9, 0.4, 2.2],
  [4.9, 0.4, 2.2],
];

// A ring of vents just inside each engine's fan-cowl exit (the cowl ends
// at z -0.6; only the core nozzle runs on behind it), where its sparks
// spit out aft, each with its engine's toggle.
const RING = 6;
const exhaust = (s, key) =>
  Array.from({ length: RING }, (_, k) => {
    const a = (k / RING) * Math.PI * 2;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    return {
      at: [s * 4.95 + dx * 0.55, -1.0 + dy * 0.55, -0.7],
      key,
      out: [dx * 0.3, dy * 0.3, -1],
    };
  });
export const EXHAUSTS = [
  ...exhaust(-1, 'plumeLeftEngine'),
  ...exhaust(1, 'plumeRightEngine'),
];
