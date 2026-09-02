// Marching budget for the radial shadow map, in the caller's world units.
// MAX_TRACE and MIN_STEP are pixel-scaled defaults from CrossTalk, which
// marches in absolute desktop pixels; a scene working in smaller units passes
// its own through buildRadialShadowConstants.
export const MARCH_STEPS = 64;
export const HIT_EPSILON = 1e-2;
export const MIN_STEP = 0.5;
export const MAX_TRACE = 8000;
export const NO_HIT = 1e5;
