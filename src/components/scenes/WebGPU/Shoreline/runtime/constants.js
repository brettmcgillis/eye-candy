// A 48m patch of surf zone seen from a drone, not a bay. Waves break where
// their height approaches the local depth, so everything here is sized to put
// the break inside the frame: a 3m shelf, ~1.5m swell, and cells small enough
// (12.5cm at the default 384) that a bore front spans several of them.
export const WORLD_SIZE = 48;
export const SEA_LEVEL = 0;

// Rows at the deep edge whose depth is forced toward the swell surface.
export const WAVE_MAKER_CELLS = 14;
