// A 48m patch of surf zone seen from a drone, not a bay. Waves break where
// their height approaches the local depth, so everything here is sized to put
// the break inside the frame: a 3m shelf, ~1.5m swell, and cells small enough
// (12.5cm at the default 384) that a bore front spans several of them.
export const WORLD_SIZE = 48;
export const GRAVITY = 9.81;
export const SEA_LEVEL = 0;

// Rows at the deep edge whose depth is forced toward the swell surface.
export const WAVE_MAKER_CELLS = 14;
export const MIN_DEPTH = 1e-3;

// Velocity is flux over depth, so a cell with a millimetre of water in it and
// any flux at all reports a singularity -- measured at 44 m/s along the
// waterline before these were added. The floor is the depth the divide is
// allowed to see and the limit is a hard cap; a surf bore runs at 3-8 m/s, so
// neither of them touches water that is behaving.
export const VELOCITY_FLOOR = 0.05;
export const SPEED_LIMIT = 12;

// The scene has to open mid-surf. A cold flood starts as flat water and takes
// most of a minute to build, so the solver runs ahead of the first frames.
// Amortised rather than burst: measured at 384, one warm-up frame costs about
// five ordinary ones at this budget and a single blocking catch-up would stall
// the first frame for seconds. 900 pairs is roughly seven simulated seconds,
// which is what it takes a bore to cross the shelf from the wave maker.
export const WARMUP_PAIRS = 900;
export const WARMUP_PER_FRAME = 12;
