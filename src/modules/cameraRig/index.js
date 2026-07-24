// Public API for the CameraRig module: a drop-in multi-mode scene camera
// (fixed/orbit/operator/spline) plus its Leva control builder and runtime
// utils, sibling to lightingRig. Scenes wire the generated controls through
// useSceneCameraControls and drop <CameraRig> into the scene. The lower-level
// hooks (useCameraSpline, useOperatorFreeCamera, …) are exported for scenes
// that compose bespoke camera behaviour. See docs/scene-conventions.md §10.
export { default as CameraRig } from './CameraRig';
export { default as useSceneCameraControls } from './useSceneCameraControls';
export { default as buildSceneCameraControls } from './buildSceneCameraControls';
export { default as useSceneCamera } from './useSceneCamera';
export { default as useCameraFitToViewport } from './useCameraFitToViewport';
export { default as useCameraSpline } from './useCameraSpline';
export { default as useOperatorFreeCamera } from './useOperatorFreeCamera';
export { default as useOperatorInput } from './useOperatorInput';
export { default as useOrbitGamepadControls } from './useOrbitGamepadControls';
export * from './sceneCameraUtils';
