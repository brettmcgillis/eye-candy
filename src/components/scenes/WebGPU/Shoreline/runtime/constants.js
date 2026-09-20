// A 48m patch of surf zone seen from a drone, not a bay. Waves break where
// their height approaches the local depth, so everything here is sized to put
// the break inside the frame: a 3m shelf, ~1.5m swell, and cells small enough
// (12.5cm at the default 384) that a bore front spans several of them.
export const WORLD_SIZE = 48;
export const SEA_LEVEL = 0;

// How far in from the deep edge of the bed the maker holds the swell surface.
// In metres rather than cells so it follows the rim of a circle or a rotated
// hexagon, and so the band no longer changes width with solver resolution.
export const WAVE_MAKER_REACH = 1.75;
