// The solver works in grid space: [0, GRID] on every axis. Everything the
// scene draws lives in one group carrying this transform, so obstacle
// geometry, particles and the sparse-grid boxes are all authored in the same
// coordinates the collision hooks see.
export const GRID = 64;
export const WORLD_SIZE = 6;
export const WORLD_SCALE = WORLD_SIZE / GRID;
export const GROUP_OFFSET = [-WORLD_SIZE / 2, -WORLD_SIZE / 2, -WORLD_SIZE / 2];

export const MAX_PINS = 10;

export const NOZZLE = { x: GRID * 0.5, y: GRID - 4, z: GRID * 0.5 };
// Power of two: the draw-order sort is a bitonic network over the whole buffer.
export const MAX_PARTICLES = 8192 * 16;
