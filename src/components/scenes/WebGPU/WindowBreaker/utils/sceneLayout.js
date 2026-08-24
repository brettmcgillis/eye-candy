export const GROUND_SIZE = 60;
export const GROUND_HALF = GROUND_SIZE / 2;
export const GROUND_Y = 0;

// Terrain mesh tessellation and (coarser) physics heightfield resolution.
export const TERRAIN_SEGMENTS = 220;
export const COLLIDER_SEGMENTS = 72;

// Rim taper: the raised layer eases back to the flat plane over this margin so
// the field never leaves a floating cliff at the border.
export const TAPER_MARGIN = 6;

export const GRASS_MAX_BLADES = 320000;
export const GRASS_AREA = 52;

// How many landed rocks can bend the grass at once (fixed-size shader array).
export const MAX_GRASS_DISTURBERS = 16;

export const ROCK_POOL_SIZE = 24;
export const ROCK_CLEANUP_Y = GROUND_Y - 30;
