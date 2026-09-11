import { folder } from 'leva';

export default function getPaletteControls(p) {
  return folder(
    {
      deepColor: { label: 'Deep Water', value: p.deepColor },
      shallowColor: { label: 'Shallow Water', value: p.shallowColor },
      aeratedColor: { label: 'Aerated', value: p.aeratedColor },
      absorption: {
        label: 'Absorption',
        value: p.absorption,
        min: 0.02,
        max: 3,
        step: 0.01,
      },
      aerationTint: {
        label: 'Aeration Tint',
        value: p.aerationTint,
        min: 0,
        max: 3,
        step: 0.02,
      },
      reefColor: { label: 'Reef', value: p.reefColor },
      reefDepth: {
        label: 'Reef Depth',
        value: p.reefDepth,
        min: 0.2,
        max: 8,
        step: 0.05,
      },
      reefStrength: {
        label: 'Reef Show',
        value: p.reefStrength,
        min: 0,
        max: 1,
        step: 0.01,
      },
      foamColor: { label: 'Fresh Foam', value: p.foamColor },
      foamOldColor: { label: 'Spent Foam', value: p.foamOldColor },
      foamThreshold: {
        label: 'Foam Cut',
        value: p.foamThreshold,
        min: 0,
        max: 0.8,
        step: 0.005,
      },
      foamSoftness: {
        label: 'Foam Soften',
        value: p.foamSoftness,
        min: 0.01,
        max: 1,
        step: 0.005,
      },
      foamBreakup: {
        label: 'Foam Breakup',
        value: p.foamBreakup,
        min: 0,
        max: 1,
        step: 0.01,
      },
      foamSwell: {
        label: 'Foam Swell',
        value: p.foamSwell,
        min: 1,
        max: 3,
        step: 0.01,
      },
      waterRoughness: {
        label: 'Water Rough',
        value: p.waterRoughness,
        min: 0.02,
        max: 1,
        step: 0.01,
      },
      foamRoughness: {
        label: 'Foam Rough',
        value: p.foamRoughness,
        min: 0.02,
        max: 1,
        step: 0.01,
      },
      rockDryColor: { label: 'Rock Dry', value: p.rockDryColor },
      rockWetColor: { label: 'Rock Wet', value: p.rockWetColor },
      rockMottle: {
        label: 'Rock Mottle',
        value: p.rockMottle,
        min: 0,
        max: 1,
        step: 0.01,
      },
      rockRoughness: {
        label: 'Rock Rough',
        value: p.rockRoughness,
        min: 0.02,
        max: 1,
        step: 0.01,
      },
      grainVariance: {
        label: 'Grain Variance',
        value: p.grainVariance,
        min: 0,
        max: 0.8,
        step: 0.01,
      },
    },
    { collapsed: true }
  );
}
