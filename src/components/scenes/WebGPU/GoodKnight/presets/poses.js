import BAKED from './bakedPoses';

// A pose is a drop (root placement + per-joint bends in degrees, world-rest
// axes) that the ragdoll settles from, plus the props it settled against.
// `.gk-bake.mjs` settles each drop headlessly and writes bakedPoses.js; the
// scene places the baked bodies so every load is the same corpse.
export const POSE_DROPS = {
  fallen: {
    label: 'Fallen in the grass',
    drop: {
      root: { position: [0, 0.35, 0], rotation: [-90, 0, 20] },
      joints: {
        head: [0, 40, 0],
        upperArmL: [0, 0, 70],
        forearmL: [-25, 0, 0],
        upperArmR: [-30, 0, -30],
        forearmR: [-60, 0, 0],
        thighL: [-30, 0, 10],
        shinL: [50, 0, 0],
        thighR: [0, 0, -8],
      },
    },
  },
  slumped: {
    label: 'Slumped against a stump',
    stump: { position: [0, 0, -0.55], radius: 0.5, height: 0.55 },
    drop: {
      root: { position: [0, 0.14, 0.2], rotation: [-12, 0, 0] },
      joints: {
        chest: [-10, 0, 0],
        head: [20, 0, 0],
        thighL: [-88, 0, 8],
        thighR: [-84, 0, -8],
        shinL: [12, 0, 0],
        shinR: [30, 0, 0],
      },
    },
  },
};

export const POSES = Object.fromEntries(
  Object.entries(POSE_DROPS).map(([id, pose]) => [
    id,
    { ...pose, bodies: BAKED[id] },
  ])
);

export const POSE_OPTIONS = Object.fromEntries(
  Object.entries(POSE_DROPS).map(([id, { label }]) => [label, id])
);

export const SETTLE_STEPS = 600;
export const WORLD_FRICTION = 1.3;
