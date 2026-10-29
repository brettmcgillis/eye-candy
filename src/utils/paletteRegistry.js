import GRADIENTS from './gradients.json';

export const PALETTE_NONE = 'None';
export const PALETTE_NAMES = GRADIENTS.map((gradient) => gradient.name);

export function getPaletteStops(name) {
  const gradient = GRADIENTS.find((entry) => entry.name === name);
  return gradient?.colors.length ? gradient.colors : null;
}
