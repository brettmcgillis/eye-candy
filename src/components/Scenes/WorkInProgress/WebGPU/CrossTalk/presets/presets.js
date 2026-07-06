// Preset snapshots for the scene. Keys here must match the Leva schema built
// in useSceneControls 1:1 — no reshaping between a preset and the controls it
// applies (see docs/scene-conventions.md, "Controls & presets").
export const DEFAULT_PRESET = 'Clouds';

export const PRESETS = {
  Clouds: {
    backgroundColor: '#87ceeb',
    syncEasing: 0.06,
    spread: 220,
    hueShift: 0,
    bobAmount: 14,
    bobSpeed: 0.4,
  },
};

// Companion fn to usePresetsFolder. Given the snapshot for the preset being
// applied, return the control values to set. Override this when a preset
// needs to derive values rather than apply the snapshot verbatim.
export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
