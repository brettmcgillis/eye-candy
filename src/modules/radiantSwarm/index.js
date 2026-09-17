// The particle population behind You're Looking Radiant, shared by its flat
// and volumetric renderers: motion (curl wander, orbit rings), the
// emit/occlude/refract roles, the palette, and the controls and presets that
// drive them. A renderer reads each body through readBody and owns nothing
// else about it.
export { default as createSwarm, EMISSION_EPSILON, readBody } from './swarm';
export { default as ROLE_MODES, ROLE_MODE_OPTIONS } from './roleModes';
export { default as buildPalette, paletteKey } from './palette';
export {
  glassControls,
  lightControls,
  lookControls,
  motionControls,
  particleControls,
  roleControls,
} from './controls';
export {
  RADIANT_DEFAULT_PRESET,
  RADIANT_PRESETS,
  withRendererKeys,
} from './presets';
