import { PALETTE_NAMES, getPaletteStops } from '@utils/gradientPalette';

const FALLBACK = ['#1d1a17', '#6b5543', '#e8dcc4'];

export default function paletteStops(name) {
  return getPaletteStops(name) ?? FALLBACK;
}

export { PALETTE_NAMES };
