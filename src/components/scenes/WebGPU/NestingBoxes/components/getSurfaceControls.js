import { folder } from 'leva';

import { SURFACE_NAMES } from '../utils/surfaces';

export const SURFACE_DEFAULTS = {
  background: '#8c8c8c',
  surface: 'Wood',
  textureScale: 2,
  textureStrength: 1,
  roughness: 0.6,
  normalStrength: 1,
  aoStrength: 1,
  weathering: 0,
  grimeColor: '#3b352d',
  grimeScale: 1.5,
  grimeStreaks: 4,
};

const slider = (value, label, min, max, step) => ({
  value,
  label,
  min,
  max,
  step,
});

export default function getSurfaceControls(defaultValues = {}) {
  const v = { ...SURFACE_DEFAULTS, ...defaultValues };

  return {
    Surface: folder(
      {
        background: { value: v.background, label: 'Background' },
        surface: {
          value: v.surface,
          label: 'Material',
          options: SURFACE_NAMES,
        },
        textureScale: slider(v.textureScale, 'Texture Scale', 0.05, 10, 0.01),
        textureStrength: slider(
          v.textureStrength,
          'Texture Strength',
          0,
          1,
          0.01
        ),
        roughness: slider(v.roughness, 'Roughness', 0, 1, 0.01),
        normalStrength: slider(v.normalStrength, 'Normal Strength', 0, 3, 0.01),
        aoStrength: slider(v.aoStrength, 'AO Strength', 0, 1, 0.01),
        Weathering: folder(
          {
            weathering: slider(v.weathering, 'Amount', 0, 1, 0.01),
            grimeColor: { value: v.grimeColor, label: 'Grime Color' },
            grimeScale: slider(v.grimeScale, 'Scale', 0.05, 10, 0.01),
            grimeStreaks: slider(v.grimeStreaks, 'Streaks', 1, 20, 0.1),
          },
          { collapsed: true }
        ),
      },
      { collapsed: true }
    ),
  };
}
