// The three-free half of BirdsArentRealCLI: option schema, roll, flock
// layout, framing and the plot. The stage it frames is
// @modules/birdsArentRealRender.
export {
  default as layoutFlock,
  BIRD_BOX,
  birdCorners,
  flockBounds,
} from './flock';
export { default as frameFlock, anglesFor } from './framing';
export { chainKeyed, meshEdges, sectionCuts, weldMesh } from './mesh';
export {
  default as renderFlockSvg,
  needsDepth,
  needsImage,
  plotArgs,
} from './plot';
export { default as rollFlockConfig, randomSeed, seedFor } from './rollConfig';
export * from './renderOptions.mjs';
