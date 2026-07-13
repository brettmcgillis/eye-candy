// Preset snapshots for the scene. Keys here must match the Leva schema built
// in useSceneControls 1:1 — no reshaping between a preset and the controls it
// applies (see docs/scene-conventions.md, "Controls & presets").
export const DEFAULT_PRESET = 'Default';

export const PRESETS = {
  // cameraMode/orbitAutoRotate here are a deliberate, live regression check
  // (docs/scene-conventions.md §10): this scene's camera.js-less default is
  // 'fixed' mode with no auto-rotate, so if the Camera folder shows Orbit +
  // Auto Rotate ON immediately on load (no "reset" click needed), the
  // preset's camera values are correctly seeding the schema on first mount.
  Default: {
    cameraMode: 'orbit',
    orbitAutoRotate: true,
  },
};

// Companion fn to usePresetsFolder. Given the snapshot for the preset being
// applied, return the control values to set. Override this when a preset
// needs to derive values rather than apply the snapshot verbatim.
export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
