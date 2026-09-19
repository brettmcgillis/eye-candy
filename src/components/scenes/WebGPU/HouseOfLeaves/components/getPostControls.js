import { folder } from 'leva';

const COLLAPSED = { collapsed: true };

export function getFogControls() {
  return folder(
    {
      fogEnabled: { label: 'Volumetric', value: true },
      fogDensity: {
        label: 'Density',
        min: 0,
        max: 0.3,
        step: 0.001,
        value: 0.045,
      },
      fogNoiseAmount: {
        label: 'Noise',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.5,
      },
      fogNoiseScale: {
        label: 'Noise Scale',
        min: 0.005,
        max: 0.5,
        step: 0.005,
        value: 0.05,
      },
      fogSteps: { label: 'Steps', min: 8, max: 64, step: 1, value: 24 },
      fogMaxDistance: {
        label: 'March m',
        min: 20,
        max: 400,
        step: 5,
        value: 160,
      },
      fogResolutionScale: {
        label: 'Resolution',
        min: 0.25,
        max: 1,
        step: 0.05,
        value: 0.5,
      },
      airGlow: {
        label: 'Air Glow',
        min: 0,
        max: 0.2,
        step: 0.001,
        value: 0.006,
      },
      airGlowColor: { label: 'Air Colour', value: '#5b6b85' },
    },
    COLLAPSED
  );
}

export function getPostControls() {
  return folder(
    {
      postEnabled: { label: 'Post', value: true },
      exposure: {
        label: 'Exposure',
        min: 0.2,
        max: 4,
        step: 0.05,
        value: 1.25,
      },
      bloomEnabled: { label: 'Bloom', value: true },
      bloomStrength: {
        label: 'Bloom Amount',
        min: 0,
        max: 2,
        step: 0.01,
        value: 0.28,
      },
      bloomThreshold: {
        label: 'Bloom Cutoff',
        min: 0,
        max: 3,
        step: 0.01,
        value: 0.75,
      },
      bloomRadius: {
        label: 'Bloom Radius',
        min: 0.1,
        max: 1.5,
        step: 0.05,
        value: 0.6,
      },
      vignetteEnabled: { label: 'Vignette', value: true },
      vignetteAmount: {
        label: 'Vignette Amount',
        min: 0,
        max: 1,
        step: 0.01,
        value: 0.45,
      },
      vignetteSoftness: {
        label: 'Vignette Soft',
        min: 0.05,
        max: 1,
        step: 0.01,
        value: 0.55,
      },
      grainEnabled: { label: 'Grain', value: true },
      grainAmount: {
        label: 'Grain Amount',
        min: 0,
        max: 0.3,
        step: 0.005,
        value: 0.045,
      },
    },
    COLLAPSED
  );
}
