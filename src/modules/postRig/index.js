// Public API for the PostRig module: a declaration-driven post-processing chain
// (component + Leva control builder + runtime utils), sibling to cameraRig and
// lightingRig. Scenes declare an ordered set of effect slots (see a scene's
// utils/post.js), wire the generated controls through useScenePostControls, and
// drop <PostRig> into the scene.
//
// One RenderPipeline owns the frame. The standalone Bloom/Godrays/Outline
// components each own their own pipeline at useFrame priority 1, so they cannot
// be combined — this module exists to compose them instead.
export { default as PostRig } from './PostRig';
export { default as useScenePostControls } from './useScenePostControls';
export { default as buildScenePostControls } from './buildScenePostControls';
export {
  buildScenePostRuntimeConfig,
  DOF_FOCUS_MODES,
  getPostControlsKey,
  getPostSlotPrefix,
  isPostControlKey,
  normalizeScenePostDeclaration,
  SCENE_POST_TYPES,
} from './scenePostUtils';
