// Preset snapshots for the scene. Keys here must match the Leva schema built
// in useSceneControls 1:1 — no reshaping between a preset and the controls it
// applies (see docs/scene-conventions.md, "Controls & presets").
export const DEFAULT_PRESET = 'Default';

export const PRESETS = {
  Default: {
    wallColor: '#e8e4da',
    wallRoughness: 0.75,
    craneCount: 1000,
    craneScale: 0.22,
    craneMass: 0.12,
    craneFriction: 0.6,
    craneRestitution: 0.15,
    craneLinearDamping: 0.8,
    craneAngularDamping: 1,
    pushRadius: 1,
    pushStrength: 0.6,
    lightColor: '#fff4e0',
    lightIntensity: 60,
    ssgiEnabled: true,
    sliceCount: 2,
    stepCount: 8,
    aoIntensity: 1,
    giIntensity: 10,
    radius: 8,
    traaEnabled: true,
    exposure: 0.7,
  },
};

// Companion fn to usePresetsFolder. Given the snapshot for the preset being
// applied, return the control values to set. Override this when a preset
// needs to derive values rather than apply the snapshot verbatim.
export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
