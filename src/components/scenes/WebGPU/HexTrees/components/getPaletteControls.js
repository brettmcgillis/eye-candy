import { folder } from 'leva';

import { PALETTE_NAMES, PALETTE_NONE } from '@utils/gradientPalette';

import { COLOR_MODES } from '../utils/palette';

// Palette controls, keys 1:1 with presets/presets.js. `colorMode` picks
// which per-branch scalar drives the 3-stop gradient (see utils/palette.js)
// — ships with just 'depth' (generation depth), architected so more modes
// can be added to COLOR_MODES later without touching this schema.
export default function getPaletteControls(p = {}) {
  return folder(
    {
      colorMode: {
        label: 'Color Mode',
        value: p.colorMode ?? 'depth',
        options: COLOR_MODES,
      },
      paletteName: {
        label: 'Palette',
        value: p.paletteName ?? PALETTE_NONE,
        options: [PALETTE_NONE, ...PALETTE_NAMES],
      },
      paletteExact: { label: 'Exact Colors', value: p.paletteExact ?? false },
      paletteStart: {
        label: 'Color Start',
        value: p.paletteStart ?? '#2a5d34',
      },
      paletteMid: { label: 'Color Mid', value: p.paletteMid ?? '#8a9b3f' },
      paletteEnd: { label: 'Color End', value: p.paletteEnd ?? '#e8d27a' },
      paletteMidpoint: {
        label: 'Midpoint',
        value: p.paletteMidpoint ?? 0.5,
        min: 0.05,
        max: 0.95,
        step: 0.01,
      },
    },
    { collapsed: true }
  );
}
