export const RESOLUTION = 256;
// A 48m patch, not a bay. Waves break where their height approaches the local
// depth, so the whole scene has to be surf-zone scale: at 120m across and 12m
// deep the pipe solve produced a pond, measured at 0.17 m/s peak flow and foam
// on 0.6% of cells. Velocity here is flux / (depth * cell), so shallower water
// over finer cells is what makes it move.
export const WORLD_SIZE = 48;
export const CELL = WORLD_SIZE / RESOLUTION;
export const GRAVITY = 9.81;
export const SEA_LEVEL = 0;
export const WAVE_MAKER_CELLS = 20;
export const MIN_DEPTH = 1e-3;
