import { folder } from 'leva';

export default function getSkyControls(defaultValues = {}) {
  return folder(
    {
      skyTint: { value: '#ffffff' },
      nightMode: { value: false },
      nightLightIntensity: { max: 1, min: 0.05, step: 0.01, value: 0.5 },
      transitionRate: { max: 3, min: 0.1, step: 0.05, value: 0.8 },
      waveLength: { max: 30, min: 1, step: 0.5, value: 5 },
      waveHeight: { max: 24, min: 0, step: 0.5, value: 8 },
      cloudCount: { max: 24, min: 0, step: 1, value: 6 },
      cloudOpacity: { max: 1, min: 0, step: 0.01, value: 1 },
      cloudDrift: { max: 0.4, min: 0, step: 0.001, value: 0.06 },
      cloudSeed: { max: 999, min: 0, step: 1, value: 11 },
      ...defaultValues,
    },
    { collapsed: true }
  );
}
