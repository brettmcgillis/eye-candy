// Fire as a small buoyant fluid on a box (three's webgpu_volume_fire,
// generalised): capsule emitters, an optional guide field baked from
// authored paths, and a box-clipped march in realistic, cartoon and clay
// looks that stops where an occluder hides it.
export { default as bakeGuide } from './bakeGuide';
export {
  default as createFireSim,
  depthOccluder,
  FAR,
  MAX_EMITTERS,
  SIM_STEP,
} from './createFireSim';
