export const GRAVITY = 9.81;
export const MIN_DEPTH = 1e-3;

// Velocity is flux over depth, so a cell with a millimetre of water in it and
// any flux at all reports a singularity -- measured at 44 m/s along a
// waterline before these were added. The floor is the depth the divide is
// allowed to see and the limit is a hard cap; a surf bore runs at 3-8 m/s, so
// neither of them touches water that is behaving.
export const VELOCITY_FLOOR = 0.05;
export const SPEED_LIMIT = 12;

// A solved field has to be running before the first frame is shown. A cold
// flood starts as flat water and takes most of a minute to build, so the
// solver runs ahead of the first frames. Amortised rather than burst: measured
// at 384, one warm-up frame costs about five ordinary ones at this budget and
// a single blocking catch-up would stall the first frame for seconds.
export const WARMUP_PAIRS = 900;
export const WARMUP_PER_FRAME = 12;
