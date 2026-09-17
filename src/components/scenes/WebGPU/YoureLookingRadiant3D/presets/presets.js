import {
  RADIANT_DEFAULT_PRESET,
  withRendererKeys,
} from '@modules/radiantSwarm';

// Keys match the Leva schema 1:1 (docs/scene-conventions.md §9). The shared
// composition lives in @modules/radiantSwarm; only the volume is ours.
export const DEFAULT_PRESET = RADIANT_DEFAULT_PRESET;

export const PRESETS = withRendererKeys(
  {
    cameraMode: 'orbit',
    orbitAutoRotate: false,
    ringTilt: 0,
    renderScale: 0.75,
    shaftSamples: 6,
    volumeDensity: 2.5,
    volumeDepth: 1,
  },
  {
    Orbits: {
      orbitAutoRotate: true,
      orbitAutoRotateSpeed: 16,
      oscillatePeriod: 2,
      refractShare: 0.75,
      ringSpeed: 0.5,
      ringTilt: 0,
      shadowSoftness: 0,
    },
  }
);

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
