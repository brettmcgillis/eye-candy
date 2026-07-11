// Preset snapshots. Keys must match the Leva schema 1:1 — flat,
// globally-unique keys, no reshaping (docs/scene-conventions.md §9).
// Schema defaults equal the 'Curl Trails' preset (presets only apply when
// selected — usePresetsFolder doesn't auto-apply on mount).
export const DEFAULT_PRESET = 'Curl Trails';

export const PRESETS = {
  'Curl Trails': {
    particlesEnabled: false,
    trailsEnabled: true,
    ghostBody: true,
    birdVisible: false,
    afterimageEnabled: false,
  },
  'Particle Bird': {
    particlesEnabled: true,
    trailsEnabled: false,
    ghostBody: false,
    birdVisible: false,
    afterimageEnabled: true,
  },
  Everything: {
    particlesEnabled: true,
    trailsEnabled: true,
    ghostBody: true,
    birdVisible: false,
    afterimageEnabled: false,
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
