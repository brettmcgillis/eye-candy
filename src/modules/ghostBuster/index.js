// The three-free half of GhostBusterCLI: option schema, roll, framing and
// the plot. The stage it frames is @modules/ghostBusterRender.
export {
  default as frameGhost,
  GHOST_BOUNDS,
  anglesFor,
  createProjector,
} from './framing';
export { default as ghostLattice, latticeBounds } from './lattice';
export { default as renderGhostSvg, needsDepth, plotArgs } from './plot';
export { default as rollGhostConfig, randomSeed, seedFor } from './rollConfig';
export * from './renderOptions.mjs';
