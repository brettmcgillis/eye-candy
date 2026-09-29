import { PALETTE_NONE } from '@modules/blockParty';
import { PALETTE_NAMES, getPaletteStops } from '@utils/gradientPalette';

// The stops a config's palette names, or null for the authored colours.
export default function paletteStops(name) {
  if (!name || name === PALETTE_NONE) return null;
  return getPaletteStops(name);
}

export { PALETTE_NAMES };
