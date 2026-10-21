// The three-free half of GhostBusterCLI: option schema, roll, framing and
// the plot. The stage it frames is @modules/ghostBusterRender.
export {
  default as frameGhost,
  GHOST_BOUNDS,
  MOTION_BOUNDS,
  anglesFor,
  animated,
  createProjector,
  stillTime,
} from './framing';
export { default as ghostLattice, latticeBounds } from './lattice';
export {
  default as renderGhostSvg,
  needsDepth,
  needsImage,
  plotArgs,
} from './plot';
export { default as rollGhostConfig, randomSeed, seedFor } from './rollConfig';
export { closePinholes, unionOf, withStorm } from './storm';
export * from './renderOptions.mjs';
