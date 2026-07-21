// Shared constants for the Radiance Cascades preset (a radial 1D shadow-map
// port — see radialShadowTSL.js). MAX_WINDOWS bounds both the per-window
// uniform arrays and the shadow map's row count (one row per window light).
export const MAX_WINDOWS = 8;
export const OCCLUDER_SHAPES = ['Circle', 'Box', 'Triangle'];
