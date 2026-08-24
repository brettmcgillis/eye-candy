import { folder } from 'leva';

export default function getPostEffectsControls(preset) {
  return folder(
    {
      'Chromatic Aberration': folder(
        {
          postChromaticAberrationEnabled: {
            label: 'Enabled',
            value: preset.postChromaticAberrationEnabled,
          },
          postChromaticAberrationStrength: {
            label: 'Strength',
            min: 0,
            max: 3,
            step: 0.01,
            value: preset.postChromaticAberrationStrength,
          },
          postChromaticAberrationScale: {
            label: 'Scale',
            min: 0.5,
            max: 3,
            step: 0.01,
            value: preset.postChromaticAberrationScale,
          },
        },
        { collapsed: true }
      ),
      'Pixel Sort': folder(
        {
          postPixelSortEnabled: {
            label: 'Enabled',
            value: preset.postPixelSortEnabled,
          },
          postPixelSortDirection: {
            label: 'Direction',
            options: ['vertical', 'horizontal'],
            value: preset.postPixelSortDirection,
          },
          postPixelSortThreshold: {
            label: 'Threshold',
            min: 0,
            max: 1,
            step: 0.01,
            value: preset.postPixelSortThreshold,
          },
          postPixelSortSteps: {
            label: 'Streak Length',
            min: 1,
            max: 64,
            step: 1,
            value: preset.postPixelSortSteps,
          },
          postPixelSortStepSize: {
            label: 'Step Size',
            min: 0.0005,
            max: 0.02,
            step: 0.0005,
            value: preset.postPixelSortStepSize,
          },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );
}
