// Scene-space facts the DumpsterFire scene, its render stage and its plot
// share. Positions are in the scene root's frame (the dumpster at the
// origin, its front toward +z) unless a name says world.

export const GROUND_Y = -1;
export const SCENE_ROOT_POSITION = [-9, GROUND_Y, 1];
export const FLOOR_COLLIDER_HALF_EXTENTS = [15, 0.25, 9];
export const FLOOR_COLLIDER_POSITION = [
  -2.25,
  GROUND_Y - FLOOR_COLLIDER_HALF_EXTENTS[1],
  1,
];

export const BACKGROUND = '#e8e8e8';
// How far the scene's establishing camera stands from its target: the fog
// range is tuned for it, so a camera farther off pushes the fog back too.
export const SCENE_CAMERA_DISTANCE = 13;
export const FOG_RANGE = [18, 34];
export const LIGHTING = {
  ambientIntensity: 0.85,
  directionalIntensity: 1.15,
  directionalPosition: [8, 12, 10],
};

export const SIDEWALK_GROUND = Object.freeze({
  enabled: true,
  length: 30,
  position: { x: -7, y: GROUND_Y, z: 0.5 },
  rotationDeg: 0,
  rows: 2,
});
export const SIDEWALK_TILE_SIZE = Object.freeze({ depth: 5.9, width: 6.99 });

export const DECOR_RUG = Object.freeze({
  colliderHalfExtents: [2.35, 0.02, 5.15],
  position: [0, -0.012, 0.55],
  rotation: [0, Math.PI / 2, 0],
  scale: 1.2,
});

// Where the scene sets its wall group; the scene drops the blocks the last
// metre onto the ground with physics, a still stands them on it.
export const BRICK_WALL_POSITION = Object.freeze({ x: -4.5, y: 1, z: 3 });

export const DUMPSTER_POSITION = [0, 0.04, 0];
export const DUMPSTER_LID_RANGE_DEG = [-159, 105];
// The box the dumpster fills at the catalog's scale 2 (measured from the
// mesh, lids included), so rolled trash keeps out of it.
export const DUMPSTER_FOOTPRINT = Object.freeze({
  max: [2.1, 1.0],
  min: [-2.1, -3.15],
});
export const DUMPSTER_TOP = 2.6;

// A normalised cinderblock (every variant is scaled to this) and the wall's
// coursing, measured from cinderblock1.glb × 0.01 scaled to 0.48 m tall.
export const BLOCK_SIZE = Object.freeze([0.9602, 0.48, 0.48]);
export const BLOCK_GAP = Object.freeze([0.04, 0.02]);
export const BLOCK_VARIANTS = 4;
export const WALL_EDGE_MARGIN = 1.2;
export const MAX_WALL_COLUMNS = 24;
export const MAX_WALL_ROWS = 9;

// What a dropped piece lands on: the rug's top inside its footprint (the
// scene's rug collider), else the ground — scene-root local heights.
const RUG_HALF = [5.15, 2.35];
const RUG_TOP = 0.04;

export function restSurface(x, z) {
  const onRug =
    Math.abs(x - DECOR_RUG.position[0]) <= RUG_HALF[0] &&
    Math.abs(z - DECOR_RUG.position[2]) <= RUG_HALF[1];
  return onRug ? RUG_TOP : 0;
}
