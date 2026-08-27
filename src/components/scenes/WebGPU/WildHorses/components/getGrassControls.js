import { folder } from 'leva';

export default function getGrassControls(defaultValues = {}) {
  return folder(
    {
      grassCount: { max: 6000, min: 100, step: 50, value: 1400 },
      grassBladeHeight: { max: 8, min: 0.5, step: 0.05, value: 2.6 },
      grassBladeWidth: { max: 6, min: 0.3, step: 0.05, value: 2.4 },
      grassHeightJitter: { max: 0.8, min: 0, step: 0.01, value: 0.35 },
      grassMinDistance: { max: 4, min: 0.2, step: 0.02, value: 1.14 },
      grassColorTint: { value: '#ffffff' },
      grassWindStrength: { max: 6, min: 0, step: 0.05, value: 2 },
      grassLightWrap: { max: 1, min: 0, step: 0.01, value: 0.56 },
      grassEdgeFade: { max: 12, min: 0.5, step: 0.1, value: 2 },
      grassSeed: { max: 999, min: 0, step: 1, value: 7 },
      ...defaultValues,
    },
    { collapsed: true }
  );
}
