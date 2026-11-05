import splinePath from '@utils/splinePath';

export const PATH_SAMPLES = 48;

// Boeing737 model space (nose +z, y up, unscaled). Each engine's fire leaves
// the exhaust, runs aft under the wing, curls up round the trailing edge and
// back over the wing, then rises as the smoke column; the wing roots burn
// up into the same column.
const engine = (s) => [
  [s * 4.9, -1, -2.6],
  [s * 4.85, -0.95, -4.4],
  [s * 4.75, -0.45, -6.7],
  [s * 4.6, 0.75, -7.7],
  [s * 4.45, 2, -6.9],
  [s * 4.2, 3.6, -6.3],
  [s * 3.8, 6, -6.9],
  [s * 3.4, 9.5, -8.1],
  [s * 3, 13.5, -9.6],
  [s * 2.6, 17, -11],
];

const wingRoot = (s) => [
  [s * 2.4, 0.7, -2],
  [s * 2.6, 1.6, -3.4],
  [s * 2.9, 3.1, -4.8],
  [s * 3.2, 5.6, -6.1],
  [s * 3.3, 8.6, -7.5],
];

export const PLUMES = [
  { key: 'plumeLeftEngine', label: 'Left Engine', points: engine(-1) },
  { key: 'plumeRightEngine', label: 'Right Engine', points: engine(1) },
  {
    key: 'plumeLeftWing',
    label: 'Left Wing Root',
    points: wingRoot(-1),
    share: 0.4,
  },
  {
    key: 'plumeRightWing',
    label: 'Right Wing Root',
    points: wingRoot(1),
    share: 0.4,
  },
].map((plume) => ({
  share: 1,
  ...plume,
  path: splinePath(
    plume.points.map(([x, y, z]) => ({ x, y, z })),
    { samples: PATH_SAMPLES }
  ),
}));

// Where each engine's fire lights the wing, in model space.
export const FIRE_LIGHTS = [
  [-4.8, -0.2, -5.6],
  [4.8, -0.2, -5.6],
];
