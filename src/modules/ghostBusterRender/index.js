// The look half of GhostBusterCLI: the R3F stage its headless renderer and
// its Live tab both mount, and the readbacks a capture takes from it.
export {
  aimCamera,
  createDepthCapture,
  depthProbe,
  readGhostLattice,
} from './capture';
export { default as createStageRoot } from './createStageRoot';
export {
  default as GhostStudio,
  backdropColor,
  ghostProps,
} from './GhostStudio';
export { SKIN_NAMES, resolveSkin } from './skins';
