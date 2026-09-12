// Virtual-pipe shallow water (Mei/Decaudin/Neyret) over a baked bed, the foam
// field it throws, and the instanced grain field that renders both.
//
// The solve is four outflow fluxes per cell driven by surface-height
// difference, scaled back so a cell can never drain more than it holds. That
// clamp is what makes wetting and drying over rock stable, and shoaling and
// refraction come free from the varying depth.
//
// A scene supplies three things and nothing else:
//
//   field       a Float32Array of vec4 per cell -- .x bed height, .y facet
//               detail for the rock shading, .z scratch for the rebase, and
//               .w the still surface the domain rests at. Every role and
//               depth question is asked against .w, so a flat sea and a
//               stream surface running downhill sort their grains alike.
//   layout      createGrainLayout's output, which is where each grain lives
//               and whether it is ground or water.
//   driver      the water's boundary: `force` (TSL, returns vec2(target depth,
//               weight) per cell), `restSurface` (TSL, the flood level), and
//               `update` (JS, per frame, for the uniforms its own controls
//               move).
//
// Everything the scenes share -- the surf, foam, grain and palette control
// keys -- is read straight off the config object by `WaterSolver.update` and
// `applyGrainUniforms`, so two scenes over this module answer to the same
// names. `reef*` is the bed reading up through the water column.
//
// Three things sit on top of the solve, and all three are the module's rather
// than a scene's because both scenes wanted the same one:
//
//   drift       a scene's own list of tracks, each naming a control key and
//               how far it may wander. GrainWater applies it per frame to a
//               copy of the config, so Leva stays the single source of truth
//               and nothing is written back into it.
//   brush       four tools over one pair of kernels -- deposit, scour, push
//               ground, push water -- with the mode carried as which gain is
//               non-zero rather than as a branch on the GPU. Strokes land on
//               the GPU's copy of the bed only, so the next CPU rebake is
//               still the last word on the shape of the place.
//   morphology  the bed answering the water back: transport capacity from the
//               solver's own speed and bed slope, a suspended load advected
//               with the flow, and the rebase pair keeping the water surface
//               where it was while the ground moves under it.
export { default as GrainWater } from './GrainWater';
export { default as WaterSolver } from './WaterSolver';
export { default as createGrainLayout } from './grains/grainLayout';
export { default as sampleField } from './sampleField';
export { default as stampMounds } from './stampMounds';
export { applyGrainUniforms, buildGrainUniforms } from './grains/grainUniforms';
export { GRAVITY, MIN_DEPTH, SPEED_LIMIT, VELOCITY_FLOOR } from './constants';
export { default as getBrushControls } from './controls/getBrushControls';
export { default as getDriftControls } from './controls/getDriftControls';
export { default as getFoamControls } from './controls/getFoamControls';
export { default as getGrainControls } from './controls/getGrainControls';
export { default as getMorphologyControls } from './controls/getMorphologyControls';
export { default as getPaletteControls } from './controls/getPaletteControls';
export { default as getStageControls } from './controls/getStageControls';
export { default as getWaterControls } from './controls/getWaterControls';
