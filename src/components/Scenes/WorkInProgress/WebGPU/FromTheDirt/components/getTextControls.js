import { folder } from 'leva';

// Controls for the carved text. No component consumes these directly — they
// feed useHeightField, which bakes the letters into the terrain.

export const FONT_OPTIONS = {
  'Arial Black': '"Arial Black", Arial, sans-serif',
  Impact: 'Impact, "Arial Black", sans-serif',
  Georgia: 'Georgia, serif',
  'Times New Roman': '"Times New Roman", serif',
  Futura: 'Futura, "Trebuchet MS", sans-serif',
  'Helvetica Neue': '"Helvetica Neue", Helvetica, sans-serif',
  'Courier New': '"Courier New", monospace',
  'Brush Script': '"Brush Script MT", cursive',
};

export default function getTextControls(p) {
  return folder(
    {
      text: { label: 'Text', value: p.text },
      fontFamily: {
        label: 'Font',
        options: FONT_OPTIONS,
        value: p.fontFamily,
      },
      fontWeight: {
        label: 'Weight',
        options: { Regular: '400', Bold: '700', Black: '900' },
        value: p.fontWeight,
      },
      textScale: {
        label: 'Size',
        max: 0.95,
        min: 0.1,
        step: 0.01,
        value: p.textScale,
      },
      letterSpacing: {
        label: 'Letter Spacing',
        max: 0.4,
        min: -0.1,
        step: 0.01,
        value: p.letterSpacing,
      },
      edgeSoftness: {
        label: 'Wall Softness',
        max: 20,
        min: 0,
        step: 0.5,
        value: p.edgeSoftness,
      },
    },
    { collapsed: false }
  );
}
