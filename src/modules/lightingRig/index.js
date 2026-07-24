// Public API for the LightingRig module: a declaration-driven lighting rig
// (component + Leva control builder + runtime utils), sibling to cameraRig.
// Scenes declare named light slots (see a scene's utils/lighting.js), wire the
// generated controls through useSceneLightingControls, and drop <LightingRig>
// into the scene. See docs/scene-conventions.md §10a.
export { default as LightingRig } from './LightingRig';
export { default as useSceneLightingControls } from './useSceneLightingControls';
export { default as buildSceneLightingControls } from './buildSceneLightingControls';
export {
  buildSceneLightingRuntimeConfig,
  getLightingControlsKey,
  isLightingControlKey,
  normalizeSceneLightingDeclaration,
  SCENE_LIGHT_TYPES,
  sphericalToPosition,
} from './sceneLightingUtils';
