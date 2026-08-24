import * as THREE from 'three/webgpu';

// Room is a sealed physics box (all six sides collide) with an invisible
// front wall so the camera can see inside — same shape as the reference
// SSGI ball-pool example, but sized for a flock of paper cranes rather than
// spheres.
export const ROOM_WIDTH = 6;
export const ROOM_HEIGHT = 5;
export const ROOM_DEPTH = 6;
export const WALL_THICKNESS = 0.3;

export const ROOM_HALF_WIDTH = ROOM_WIDTH / 2;
export const ROOM_HALF_HEIGHT = ROOM_HEIGHT / 2;
export const ROOM_HALF_DEPTH = ROOM_DEPTH / 2;

// Interaction plane sits just inside the front wall so the cursor can reach
// in without clipping through glass. It only exists to give R3F's pointer
// events something to raycast against — the resulting event.ray is used to
// reach cranes at any depth, not just at this plane.
export const INTERACTION_PLANE_Z = ROOM_HALF_DEPTH - 0.05;

const SPAWN_MARGIN = 0.35;

// A generous per-crane cell size (based on the model's longest diagonal at
// this scale) so a full grid of instances never starts overlapping — random
// scatter spawn was launching cranes through the walls at high count because
// overlapping hulls explode apart on the first physics step.
function getSpawnCellSize(craneScale) {
  return craneScale * 3.6;
}

export function buildCraneGrid(count, craneScale) {
  const cell = getSpawnCellSize(craneScale);
  const columns = Math.max(1, Math.floor(ROOM_WIDTH / cell));
  const layers = Math.max(1, Math.floor(ROOM_DEPTH / cell));

  const originX = -((columns - 1) * cell) / 2;
  const originZ = -((layers - 1) * cell) / 2;
  const jitter = cell * 0.2;

  const maxCeilingY = ROOM_HEIGHT - craneScale * 1.5;

  return Array.from({ length: count }, (_, index) => {
    const column = index % columns;
    const layer = Math.floor(index / columns) % layers;
    const row = Math.floor(index / (columns * layers));

    return [
      originX + column * cell + THREE.MathUtils.randFloatSpread(jitter),
      Math.min(
        craneScale * 1.5 + row * cell + THREE.MathUtils.randFloatSpread(jitter),
        maxCeilingY
      ),
      originZ + layer * cell + THREE.MathUtils.randFloatSpread(jitter),
    ];
  });
}

export function getRandomTopSpawnPosition(craneScale) {
  const marginX = ROOM_HALF_WIDTH - SPAWN_MARGIN * craneScale * 4;
  const marginZ = ROOM_HALF_DEPTH - SPAWN_MARGIN * craneScale * 4;

  return [
    THREE.MathUtils.randFloatSpread(2 * Math.max(marginX, 0.2)),
    ROOM_HEIGHT - craneScale * 2 - Math.random() * craneScale * 2,
    THREE.MathUtils.randFloatSpread(2 * Math.max(marginZ, 0.2)),
  ];
}

export function getRandomEuler() {
  return [
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
  ];
}

const ESCAPE_MARGIN = 1;

// Defensive net: even with grid spawning + CCD, a stray solver spike can
// still shove a body through a wall. Anything found outside these bounds
// gets recycled back in rather than left to fall forever.
export function isOutsideRoom(position) {
  return (
    position.y < -ESCAPE_MARGIN ||
    position.y > ROOM_HEIGHT + ESCAPE_MARGIN ||
    Math.abs(position.x) > ROOM_HALF_WIDTH + ESCAPE_MARGIN ||
    Math.abs(position.z) > ROOM_HALF_DEPTH + ESCAPE_MARGIN
  );
}
