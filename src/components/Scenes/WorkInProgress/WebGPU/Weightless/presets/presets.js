// Preset snapshots. Keys must match the Leva schema 1:1 — flat,
// globally-unique keys, no reshaping (docs/scene-conventions.md §9).
export const DEFAULT_PRESET = 'Default';

export const PRESETS = {
  Default: {},
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
