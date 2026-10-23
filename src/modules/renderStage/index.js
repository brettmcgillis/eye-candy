// The R3F stage kit the render workbenches share: GhostBuster's studio
// (Lightformer environment, backdrop), a shadow-catching floor, the
// headless root a CLI mounts its real stage on, and the capture readbacks.
export { default as Backdrop } from './Backdrop';
export {
  aimCamera,
  createAlbedoCapture,
  createDepthCapture,
  createNormalCapture,
  depthProbe,
  meshEntry,
  readMeshes,
  setBackdrop,
  tightRows,
} from './capture';
export { default as createMeshPlotter } from './meshPlotter';
export { default as createStageRoot } from './createStageRoot';
export { default as ShadowFloor } from './ShadowFloor';
export {
  default as StudioEnvironment,
  LIGHTFORMERS,
} from './StudioEnvironment';
