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
// solver runs ahead of the first frames.
//
// Amortised rather than burst, and the budget is what decides how that feels.
// Measured at 384 on the stream: a settled frame is 7.7ms and each extra pair
// costs 3.9ms, so the old budget of 12 made a 54ms frame -- seven times an
// ordinary one -- for 75 frames. That is a visible four-second crawl every
// time the warm-up is armed. Five pairs holds the frame near 27ms and spends
// the same total work over 180 frames instead, which reads as the scene
// settling rather than as the scene struggling.
export const WARMUP_PAIRS = 900;
export const WARMUP_PER_FRAME = 5;

// A reflood mid-session is not a cold start. The domain is already at its rest
// level and the shape around it has only just changed, so what has to rebuild
// is the flow near the new geometry rather than a whole field from flat water.
// Measured on the stream, 180 pairs recovers most of the drain-down that 900
// does; the rest arrives while the scene is being looked at.
export const REFLOOD_PAIRS = 180;
