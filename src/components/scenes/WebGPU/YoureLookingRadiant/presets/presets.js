import {
  RADIANT_DEFAULT_PRESET,
  withRendererKeys,
} from '@modules/radiantSwarm';

// Keys match the Leva schema 1:1 (docs/scene-conventions.md §9). The shared
// composition lives in @modules/radiantSwarm.
export const DEFAULT_PRESET = RADIANT_DEFAULT_PRESET;

export const PRESETS = withRendererKeys({});

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
