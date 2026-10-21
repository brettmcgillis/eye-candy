// The look half of BirdsArentRealCLI: the R3F stage its headless renderer
// and its Live tab both mount, and the readbacks a capture takes from it.
export {
  aimCamera,
  createDepthCapture,
  depthProbe,
  tightRows,
} from '@modules/renderStage';
export { default as BirdStudio } from './BirdStudio';
export { flockMeshes, readFlockMesh } from './capture';
export { default as createStageRoot } from './createStageRoot';
export { default as SPECIES_NAMES } from './species';
