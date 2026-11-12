import { choice, color, flag, num } from '../optionSchema/index.mjs';

export const PAINT_KEYS = [
  'paintStyle',
  'paintOpacity',
  'paintScale',
  'paintGrain',
  'paintInk',
  'paintPaper',
  'paintBleed',
  'paintPooling',
  'paintHatchRoughness',
  'paintStrokeRoughness',
  'paintFollowPalette',
];

export function paintOptions(section = 'painting') {
  return {
    paintStyle: choice(
      section,
      null,
      'Treatment',
      ['original', 'watercolor', 'pencil'],
      'original'
    ),
    paintOpacity: num(section, null, 'Pigment', 0.75, 0, 1, 0.01),
    paintScale: num(section, null, 'Mark scale', 1, 0.25, 6, 0.05),
    paintGrain: num(section, null, 'Paper grain', 0.18, 0, 0.6, 0.01),
    paintInk: color(section, null, 'Drawing ink', '#514a45'),
    paintPaper: color(section, null, 'Painting paper', '#f6f2e9'),
    paintBleed: num(section, null, 'Loose wash edges', 1, 0, 1, 0.01, {
      help: '0 keeps clean resist boundaries; 1 retains the native brush bleed and paper reserves',
    }),
    paintPooling: num(section, null, 'Evaporation lines', 0.7, 0, 1, 0.01),
    paintHatchRoughness: num(
      section,
      null,
      'Hatch looseness',
      0.75,
      0,
      1,
      0.01
    ),
    paintStrokeRoughness: num(section, null, 'Pen looseness', 0.75, 0, 1, 0.01),
    paintFollowPalette: flag(section, null, 'Palette paints and ink', true, {
      help: 'Use scene colours for drawing ink and painted accents; off keeps the custom drawing ink',
    }),
  };
}

export { default as hashPaintSeed } from './seed.mjs';

export { default as watercolorStages } from './watercolor.mjs';
