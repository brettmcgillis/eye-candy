import { folder } from 'leva';

import { PALETTE_NAMES } from '@utils/gradientPalette';

export const COLOR_DEFAULTS = {
  colorMode: 'tint',
  baseColor: '#d8d4cc',
  tintFrequency: 0.5,
  tintPhaseR: 0,
  tintPhaseG: 0.5,
  tintPhaseB: 1,
  tintBase: 0.55,
  tintAmplitude: 0.45,
  paletteName: 'Ash',
  paletteExact: false,
  paletteSource: 'height',
  paletteRepeat: 1,
  paletteShift: 0,
};

const TAU = Math.PI * 2;

export default function getColorControls({ defaultValues = {}, folderPath }) {
  const v = { ...COLOR_DEFAULTS, ...defaultValues };
  const mode = (get) => get(`${folderPath}.colorMode`);
  const isTint = (get) => mode(get) === 'tint';
  const isPalette = (get) => mode(get) === 'palette';
  const phase = (value, label) => ({
    value,
    label,
    min: 0,
    max: TAU,
    step: 0.01,
    render: isTint,
  });

  return {
    Color: folder(
      {
        colorMode: {
          value: v.colorMode,
          label: 'Mode',
          options: { 'Sine Tint': 'tint', Solid: 'solid', Palette: 'palette' },
        },
        baseColor: {
          value: v.baseColor,
          label: 'Color',
          render: (get) => mode(get) === 'solid',
        },
        tintFrequency: {
          value: v.tintFrequency,
          label: 'Frequency',
          min: 0,
          max: 10,
          step: 0.001,
          render: isTint,
        },
        tintPhaseR: phase(v.tintPhaseR, 'Phase R'),
        tintPhaseG: phase(v.tintPhaseG, 'Phase G'),
        tintPhaseB: phase(v.tintPhaseB, 'Phase B'),
        tintBase: {
          value: v.tintBase,
          label: 'Base',
          min: 0,
          max: 1,
          step: 0.01,
          render: isTint,
        },
        tintAmplitude: {
          value: v.tintAmplitude,
          label: 'Amplitude',
          min: 0,
          max: 1,
          step: 0.01,
          render: isTint,
        },
        paletteName: {
          value: v.paletteName,
          label: 'Palette',
          options: PALETTE_NAMES,
          render: isPalette,
        },
        paletteExact: {
          value: v.paletteExact,
          label: 'Exact Colors',
          render: isPalette,
        },
        paletteSource: {
          value: v.paletteSource,
          label: 'Color By',
          options: {
            Node: 'id',
            Height: 'height',
            Size: 'size',
            Random: 'random',
          },
          render: isPalette,
        },
        paletteRepeat: {
          value: v.paletteRepeat,
          label: 'Repeat',
          min: 0.1,
          max: 10,
          step: 0.01,
          render: isPalette,
        },
        paletteShift: {
          value: v.paletteShift,
          label: 'Shift',
          min: -1,
          max: 1,
          step: 0.001,
          render: isPalette,
        },
      },
      { collapsed: true }
    ),
  };
}
