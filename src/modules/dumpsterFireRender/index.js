// The look half of DumpsterFireCLI and the pieces the DumpsterFire scene
// shares with it: the R3F stage its headless renderer and its Live tab
// mount, the readbacks a capture takes from it, and the scene's sidewalk,
// cinderblocks, fire lights and smoke authoring.
export {
  aimCamera,
  createDepthCapture,
  depthProbe,
  tightRows,
} from '@modules/renderStage';
export {
  fitFog,
  measureSmoke,
  readFlames,
  readSmokeDots,
  readSolids,
  showSmoke,
  solidMeshes,
} from './capture';
export { CINDERBLOCK_ASSETS, default as useCinderblocks } from './cinderblocks';
export { default as createStageRoot } from './createStageRoot';
export { default as DumpsterStage } from './DumpsterStage';
export { default as FireLights, DEFAULT_FIRE_LIGHT_RIG } from './FireLights';
export * from './fireAndSmokeAuthoring';
export * from './particleSmokeAuthoring';
export { default as SidewalkGround } from './SidewalkGround';
export {
  applySmokeGeneration,
  authoredSmoke,
  smokePaths,
  trimPaths,
  smokePoints,
} from './smokeGeneration';
