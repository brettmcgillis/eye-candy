// The look half of CandleCLI and the Burning At Both Ends scene: the R3F
// stage the scene, the headless renderer and the Live tab all mount, the
// fluid-sim flame and curl smoke it draws, and the read-backs a capture
// takes from it.
export {
  aimCamera,
  createAlbedoCapture,
  createDepthCapture,
  depthProbe,
  tightRows,
} from '@modules/renderStage';
export {
  candleMeshes,
  effectGlow,
  readFlameFields,
  readSmokeBalls,
  readSmokeDots,
  readWax,
  showEffects,
} from './capture';
export { default as CandleStage } from './CandleStage';
export { default as createStageRoot } from './createStageRoot';
