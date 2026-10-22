import { createRng } from '@modules/flora';

import { DUMPSTER_FOOTPRINT } from './constants';
import { composeYaw } from './rotation';

const { PI } = Math;

// The scene's hand-placed litter, verbatim: [key, position, rotation]. Some
// authored yaws are degrees passed as radians (`[0, 90, 0]`); they are the
// look, so they stay.
const AUTHORED_FIXED = [
  ['litter', [1, 0.085, 1], [0, 0, 0]],
  ['litter-2', [0, 0.085, 0], [0, 0, 0]],
  ['litter', [-2, 0.085, 0.8], [0, 0, 0]],
  ['cardboard-flat', [-2, 0.08, 1], [0, 90, 0]],
  ['newspaper-1', [-1, 0.04, 1.4], [0, 90, 0]],
  ['vhs-tape', [0.8, 0.07, 1.45], [PI / 2, PI, -PI / 9]],
  ['cassette-tape-1', [-0.2, 0.07, 1.6], [PI / 2, PI, 0]],
  ['cassette-tape-2', [1.85, 0.07, 1.9], [PI / 2, -PI, 0]],
  ['cassette-tape-3', [4.1, 0.07, 1.45], [PI / 2.2, PI, 0]],
  ['floppy-disk', [-1.35, 0.07, 2.05], [PI / 2, -PI, PI / 7]],
  ['litter-2', [-3.5, 0.085, 1], [0, -PI / 3, 0]],
  ['garbage-bags-1', [-2.7, 0.04, 0], [0, 90, 0]],
  ['cardboard-box', [-2.2, 0.42, 1.2], [0, 90, 0]],
  ['cardboard-box-1', [-3.2, 0.19, 1.2], [0, PI / 3, 0]],
  ['cardboard-box-1', [-3.75, 0.19, 1.2], [0, PI / 1.7, 0]],
  ['cardboard-box-1', [-3.45, 0.49, 1.2], [0, PI / 2, 0]],
  ['newspaper-2', [-5, 0.04, 2], [0, 90, 0]],
  ['cigarette-butts', [0, 0.04, 1.7], [0, -PI / 1.5, 0]],
  ['cigarette-butts', [0.7, 0.04, 1.2], [0, PI / 2.5, 0]],
  ['newspaper-stack', [-1.5, 0.17, 1.25], [0, -PI / 1.5, 0]],
  ['cardboard-flat-2', [2.4, 0.1, 0.75], [0, 0, 0]],
  ['cardboard-box-3', [2, 0.29, 1.55], [0, -PI / 2, 0]],
  ['cardboard-box-1', [1.4, 0.2, 1.3], [0, PI / 3, 0]],
  ['cardboard-leaning-2', [2.17, 0.29, 0], [0, PI / 2, 0]],
  ['litter', [3, 0.085, 0.8], [0, -PI / 4, 0]],
  ['cigarette-butts', [3, 0.04, 1.6], [0, PI, 0]],
  ['garbage-bags-2', [2.5, 0.04, 0], [0, -PI / 1.3, 0]],
  ['cardboard-box-2', [3.1, 0.24, 0.35], [0, PI / 2, 0]],
  ['cardboard-box', [3.1, 0.44, -0.75], [0, PI / 7, 0]],
  ['newspaper-stack', [2.6, 0.17, 1.25], [0, -PI / 1.5, 0]],
  ['newspaper-3', [4.5, 0.04, 1.2], [0, 90, 0]],
];

// [id, key, position, rotation]
const AUTHORED_LOOSE = [
  ['right-garbage-bag', 'garbage-bag', [-4.0, 0, 0.2], [0, PI / 1.5, 0]],
  ['left-garbage-bag', 'garbage-bag-1', [4, 0, 0.25], [0, 0, 0]],
  ['front-right-cup', 'starbucks-cup', [-1.1, 0.02, 1.95], [PI / 2, PI / 5, 0]],
  ['left-side-cup', 'starbucks-cup', [3.55, 0.02, 1.05], [PI / 2, -PI / 3, 0]],
  [
    'front-apple-core',
    'apple-core',
    [0.15, 0.03, 2.05],
    [PI / 5, -PI / 6, PI / 7],
  ],
  [
    'left-apple-core',
    'apple-core',
    [3.4, 0.03, 1.85],
    [PI / 6, PI / 4, -PI / 5],
  ],
  ['front-left-box-4', 'cardboard-box-4', [-2.4, 0.02, 2.2], [0, PI / 7, 0]],
  ['front-right-box-5', 'cardboard-box-5', [1.85, 0.02, 2.1], [0, -PI / 6, 0]],
  ['right-side-beer-case-1', 'beer-case-1', [-5.1, 0.02, 0.95], [0, PI / 9, 0]],
  ['left-side-beer-case-2', 'beer-case-2', [4.8, 0.02, -0.2], [0, -PI / 4, 0]],
  [
    'front-whiskey-bottle',
    'whiskey-bottle',
    [-0.2, 0.04, 2.5],
    [0, PI / 3, PI / 2],
  ],
  [
    'right-beer-bottle-1',
    'beer-bottle-1',
    [-4.55, 0.03, 1.55],
    [PI / 10, 0, PI / 2],
  ],
  [
    'left-beer-bottle-2',
    'beer-bottle-2',
    [4.15, 0.03, 1.55],
    [PI / 12, 0, -PI / 2],
  ],
  ['front-left-soda-can', 'soda-can', [-3.05, 0.03, 2.7], [1, 1, 1]],
  ['front-right-soda-can', 'soda-can', [2.75, 0.03, 2.65], [2, -2, 2]],
  ['right-side-snickers', 'snickers', [-5.35, 0.03, 1.85], [0, PI / 8, 0]],
  ['left-side-snickers', 'snickers', [4.85, 0.03, 2.15], [0, -PI / 7, 0]],
  ['front-bucket', 'bucket', [0.95, 0.4, 2.35], [0, -PI / 8, 0]],
  ['front-left-catfood', 'catfood', [-1.7, 0.04, 2.45], [0, PI / 5, 0]],
  ['right-side-catfood', 'catfood', [-4.75, 0.04, 1.2], [0, -PI / 6, 0]],
];

// What sits in the dumpster: the bag pile and the bag on top of it.
const CONTENTS = {
  empty: [],
  full: [
    ['garbage-bags-pile', [0, 1.04, 0.1], [0, 0, 0]],
    ['garbage-bags-2', [-1, 2.04, 0.1], [0, 0, 0]],
  ],
  pile: [['garbage-bags-pile', [0, 1.04, 0.1], [0, 0, 0]]],
};

// The box stack (two side by side, one on top) moves as one piece.
const STACK = AUTHORED_FIXED.slice(13, 16);
const STACK_CENTER = [-3.475, 0, 1.2];

// Widest extent in metres, for spacing rolled pieces (the scene's asset
// grid table).
export const ASSET_SIZE = {
  'apple-core': 0.08,
  'beer-bottle-1': 0.24,
  'beer-bottle-2': 0.24,
  'beer-case-1': 0.45,
  'beer-case-2': 0.45,
  bucket: 0.36,
  'cardboard-box': 0.75,
  'cardboard-box-1': 0.64,
  'cardboard-box-2': 0.68,
  'cardboard-box-3': 0.66,
  'cardboard-box-4': 0.72,
  'cardboard-box-5': 0.74,
  'cardboard-flat': 1.05,
  'cardboard-flat-2': 1.05,
  'cardboard-leaning-2': 1.1,
  'cassette-tape-1': 0.1,
  'cassette-tape-2': 0.1,
  'cassette-tape-3': 0.1,
  catfood: 0.2,
  'cigarette-butts': 0.12,
  'floppy-disk': 0.09,
  'garbage-bag': 0.85,
  'garbage-bag-1': 0.85,
  'garbage-bags-1': 0.95,
  'garbage-bags-2': 0.95,
  'garbage-bags-pile': 1.25,
  litter: 0.34,
  'litter-2': 0.28,
  'newspaper-1': 0.58,
  'newspaper-2': 0.58,
  'newspaper-3': 0.58,
  'newspaper-stack': 0.58,
  snickers: 0.11,
  'soda-can': 0.13,
  'starbucks-cup': 0.17,
  'vhs-tape': 0.19,
  'whiskey-bottle': 0.12,
};

// Half the widest ground span of each piece as the scene draws it, measured
// from the meshes in their authored poses (the grid sizes above run small),
// for spacing rolled pieces.
const FOOTPRINT = {
  'apple-core': 0.16,
  'beer-bottle-1': 0.23,
  'beer-bottle-2': 0.21,
  'beer-case-1': 0.47,
  'beer-case-2': 0.57,
  bucket: 0.42,
  'cardboard-box': 0.53,
  'cardboard-box-1': 0.38,
  'cardboard-box-2': 0.34,
  'cardboard-box-3': 0.34,
  'cardboard-box-4': 0.52,
  'cardboard-box-5': 0.4,
  'cardboard-leaning-2': 1.08,
  'cassette-tape-1': 0.21,
  'cassette-tape-2': 0.21,
  'cassette-tape-3': 0.21,
  catfood: 0.15,
  'floppy-disk': 0.18,
  'garbage-bag': 0.71,
  'garbage-bag-1': 0.61,
  'garbage-bags-1': 0.95,
  'garbage-bags-2': 0.85,
  'newspaper-stack': 0.4,
  snickers: 0.2,
  'soda-can': 0.26,
  'starbucks-cup': 0.24,
  'vhs-tape': 0.37,
  'whiskey-bottle': 0.21,
};

// Lies flat on the ground: anything may rest on it, so it never blocks.
const FLAT = new Set([
  'cardboard-flat',
  'cardboard-flat-2',
  'cigarette-butts',
  'litter',
  'litter-2',
  'newspaper-1',
  'newspaper-2',
  'newspaper-3',
]);

const authoredFixed = () =>
  AUTHORED_FIXED.map(([key, position, rotation]) => ({
    body: 'fixed',
    key,
    position: [...position],
    rotation: [...rotation],
  }));

const authoredLoose = () =>
  AUTHORED_LOOSE.map(([id, key, position, rotation]) => ({
    body: 'dynamic',
    drop: true,
    id,
    key,
    position: [...position],
    rotation: [...rotation],
  }));

const contentsOf = (name) =>
  (CONTENTS[name] ?? CONTENTS.full).map(([key, position, rotation]) => ({
    body: 'fixed',
    key,
    position: [...position],
    rotation: [...rotation],
  }));

// Rest poses the rolled layout reuses: every authored ground piece's height
// and tilt, whatever its yaw.
const REST_FIXED = AUTHORED_FIXED.filter((_, i) => i < 13 || i > 15).map(
  ([key, position, rotation]) => ({ key, rotation, y: position[1] })
);
const REST_LOOSE = AUTHORED_LOOSE.filter(
  ([, key]) => key !== 'bucket' && !key.startsWith('garbage-bag')
).map(([, key, position, rotation]) => ({ key, rotation, y: position[1] }));
const REST_BAGS = AUTHORED_LOOSE.filter(([, key]) =>
  key.startsWith('garbage-bag')
).map(([, key, position, rotation]) => ({ key, rotation, y: position[1] }));
const REST_BUCKET = AUTHORED_LOOSE.filter(([, key]) => key === 'bucket').map(
  ([, key, position, rotation]) => ({ key, rotation, y: position[1] })
);

function footprintGap(x, z) {
  const { max, min } = DUMPSTER_FOOTPRINT;
  const dx = Math.max(min[0] - x, 0, x - max[0]);
  const dz = Math.max(min[1] - z, 0, z - max[1]);
  return Math.hypot(dx, dz);
}

const insideDumpster = (x, z, r) => {
  const { max, min } = DUMPSTER_FOOTPRINT;
  return x > min[0] - r && x < max[0] + r && z > min[1] - r && z < max[1] + r;
};

// Scatters `count` pieces drawn from `poses` over the ground round the
// dumpster: `huddle` pulls them toward it (0 even, 1 tight), `spread`
// scales how far along the wall they reach. Non-flat pieces keep their
// footprints apart from each other and from `taken`.
function scatter(rng, poses, count, { huddle, spread, taken, prefix, body }) {
  const placed = [];
  const xMin = -5.6 * spread;
  const xMax = 5.4 * spread;
  const zMin = -1.05;
  const zMax = 2.85;
  const falloff = 0.4 + (1 - huddle) * 6;
  for (let n = 0; n < count; n += 1) {
    const pose = poses[Math.floor(rng() * poses.length)];
    const radius = (FOOTPRINT[pose.key] ?? 0.3) * 0.8;
    const flat = FLAT.has(pose.key);
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const x = xMin + (xMax - xMin) * rng();
      const z = zMin + (zMax - zMin) * rng();
      const accepted =
        rng() < Math.exp(-footprintGap(x, z) / falloff) &&
        !insideDumpster(x, z, flat ? -0.3 : radius) &&
        (flat ||
          taken.every(
            (other) =>
              Math.hypot(other.x - x, other.z - z) > other.radius + radius
          ));
      if (accepted) {
        const yaw = rng() * PI * 2;
        if (!flat) taken.push({ radius, x, z });
        placed.push({
          body,
          drop: true,
          ...(body === 'dynamic' && { id: `${prefix}-${n}` }),
          key: pose.key,
          position: [x, pose.y, z],
          rotation: composeYaw(yaw, pose.rotation),
        });
        break;
      }
    }
  }
  return placed;
}

// Where the scene's trash goes. `authored` is the hand-placed layout;
// `rolled` keeps every piece's authored rest pose but redraws which pieces,
// how many and where, from `trashSeed`. Positions are scene-root local;
// `fixed` pieces are static, `dynamic` ones are the scene's physics bodies.
// A `drop` piece's position is where physics lets it fall from, not where
// it rests; a still without physics settles it onto restSurface.
export default function layoutTrash(config) {
  const contents = contentsOf(config.dumpsterContents);
  if (config.trashLayout !== 'rolled') {
    return {
      dynamic: authoredLoose(),
      fixed: [...contents, ...authoredFixed()],
    };
  }
  const rng = createRng(`trash:${config.trashSeed}`);
  const taken = [];
  const options = {
    huddle: config.trashHuddle,
    spread: config.trashSpread,
    taken,
  };
  const fixed = [...contents];
  if (rng() < config.trashStacks) {
    const stackX =
      (rng() < 0.5 ? -1 : 1) * (2.9 + rng() * 1.6 * config.trashSpread);
    const stackZ = 0.3 + rng() * 1.6;
    const yaw = (rng() - 0.5) * 0.8;
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    STACK.forEach(([key, position, rotation]) => {
      const dx = position[0] - STACK_CENTER[0];
      const dz = position[2] - STACK_CENTER[2];
      fixed.push({
        body: 'fixed',
        key,
        position: [
          stackX + dx * c + dz * s,
          position[1],
          stackZ - dx * s + dz * c,
        ],
        rotation: composeYaw(yaw, rotation),
      });
    });
    taken.push({ radius: 0.85, x: stackX, z: stackZ });
  }
  const bags = scatter(rng, REST_BAGS, Math.round(config.trashBags), {
    ...options,
    body: 'dynamic',
    prefix: 'bag',
  });
  fixed.push(
    ...scatter(rng, REST_FIXED, Math.round(config.trashFixed), {
      ...options,
      body: 'fixed',
    })
  );
  const dynamic = [
    ...bags,
    ...scatter(rng, REST_BUCKET, rng() < 0.6 ? 1 : 0, {
      ...options,
      body: 'dynamic',
      prefix: 'bucket',
    }),
    ...scatter(rng, REST_LOOSE, Math.round(config.trashLoose), {
      ...options,
      body: 'dynamic',
      prefix: 'loose',
    }),
  ];
  return { dynamic, fixed };
}

export const TRASH_KEYS = [
  ...new Set([
    ...AUTHORED_FIXED.map(([key]) => key),
    ...AUTHORED_LOOSE.map(([, key]) => key),
    ...Object.values(CONTENTS).flatMap((list) => list.map(([key]) => key)),
  ]),
];
