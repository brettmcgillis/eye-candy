import { folder } from 'leva';

export default function getGroundControls(preset) {
  return folder(
    {
      groundEnabled: { label: 'Enabled', value: preset.groundEnabled },
      groundSize: {
        label: 'Plane Size',
        min: 20,
        max: 240,
        step: 1,
        value: preset.groundSize,
      },
      Markings: folder(
        {
          groundBlockSize: {
            label: 'Block Size',
            min: 12,
            max: 80,
            step: 1,
            value: preset.groundBlockSize,
          },
          groundStreetWidth: {
            label: 'Street Width',
            min: 4,
            max: 30,
            step: 0.5,
            value: preset.groundStreetWidth,
          },
          groundPaintColor: {
            label: 'Paint Color',
            value: preset.groundPaintColor,
          },
          groundPaintWidth: {
            label: 'Paint Width',
            min: 0,
            max: 4,
            step: 0.01,
            value: preset.groundPaintWidth,
          },
          groundPaintWear: {
            label: 'Paint Wear',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.groundPaintWear,
          },
          groundDashPeriod: {
            label: 'Dash Period',
            min: 1,
            max: 30,
            step: 0.5,
            value: preset.groundDashPeriod,
          },
          groundCrosswalkWidth: {
            label: 'Crosswalk Reach',
            min: 0,
            max: 20,
            step: 0.5,
            value: preset.groundCrosswalkWidth,
          },
        },
        { collapsed: true }
      ),
      Surface: folder(
        {
          groundColorDark: {
            label: 'Color Dark',
            value: preset.groundColorDark,
          },
          groundColorLight: {
            label: 'Color Light',
            value: preset.groundColorLight,
          },
          groundPatchScale: {
            label: 'Patch Scale',
            min: 0.01,
            max: 2,
            step: 0.01,
            value: preset.groundPatchScale,
          },
          groundRoughness: {
            label: 'Roughness',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.groundRoughness,
          },
          groundBump: {
            label: 'Bump',
            min: 0,
            max: 6,
            step: 0.05,
            value: preset.groundBump,
          },
        },
        { collapsed: true }
      ),
      Wear: folder(
        {
          groundGritScale: {
            label: 'Grit Scale',
            min: 0.5,
            max: 40,
            step: 0.1,
            value: preset.groundGritScale,
          },
          groundGritAmount: {
            label: 'Grit Amount',
            min: 0,
            max: 1.5,
            step: 0.01,
            value: preset.groundGritAmount,
          },
          groundStainScale: {
            label: 'Stain Scale',
            min: 0.02,
            max: 3,
            step: 0.01,
            value: preset.groundStainScale,
          },
          groundStainAmount: {
            label: 'Stain Amount',
            min: 0,
            max: 2,
            step: 0.01,
            value: preset.groundStainAmount,
          },
          groundCrackScale: {
            label: 'Crack Scale',
            min: 0.05,
            max: 6,
            step: 0.05,
            value: preset.groundCrackScale,
          },
          groundCrackAmount: {
            label: 'Crack Amount',
            min: 0,
            max: 2,
            step: 0.01,
            value: preset.groundCrackAmount,
          },
        },
        { collapsed: true }
      ),
      Wet: folder(
        {
          groundWetScale: {
            label: 'Wet Scale',
            min: 0.01,
            max: 1,
            step: 0.01,
            value: preset.groundWetScale,
          },
          groundWetAmount: {
            label: 'Wet Amount',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.groundWetAmount,
          },
          groundWetRoughness: {
            label: 'Wet Roughness',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.groundWetRoughness,
          },
        },
        { collapsed: true }
      ),
      Detail: folder(
        {
          groundDetailNear: {
            label: 'Detail Near',
            min: 1,
            max: 120,
            step: 1,
            value: preset.groundDetailNear,
          },
          groundDetailFar: {
            label: 'Detail Far',
            min: 10,
            max: 500,
            step: 5,
            value: preset.groundDetailFar,
          },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
}
