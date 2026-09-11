import { button, folder } from 'leva';

export default function getCityControls(preset = {}, { onReseed } = {}) {
  return folder(
    {
      seed: {
        label: 'Seed',
        max: 9999,
        min: 1,
        step: 1,
        value: preset.seed ?? 2,
      },
      reseed: button(() => onReseed?.()),
      referenceHeight: {
        label: 'Reference Height',
        max: 1600,
        min: 400,
        step: 10,
        value: preset.referenceHeight ?? 900,
      },
      citySize: {
        label: 'City Size',
        max: 40,
        min: 2,
        step: 0.5,
        value: preset.citySize ?? 12,
      },
      honorSeedZoom: {
        label: 'Seed Crop',
        value: preset.honorSeedZoom ?? true,
      },
      towerVariants: {
        label: 'Tower Forms',
        max: 16,
        min: 1,
        step: 1,
        value: preset.towerVariants ?? 8,
      },
      stairNarrowing: {
        label: 'Stair Taper',
        max: 0.6,
        min: 0,
        step: 0.01,
        value: preset.stairNarrowing ?? 0.18,
      },
    },
    { collapsed: true }
  );
}
