/* eslint-disable no-bitwise */
import GRADIENTS from '../../../../../../utils/gradients.json';

// Leva "Palette" dropdown options — 'Random' (existing per-bundle random hue
// behavior) plus every named gradient in the shared gradients.json.
export const PALETTE_NAMES = ['Random', ...GRADIENTS.map((g) => g.name)];

export function resolvePaletteColors(paletteName) {
  if (!paletteName || paletteName === 'Random') return null;
  const gradient = GRADIENTS.find((g) => g.name === paletteName);
  return gradient ? gradient.colors : null;
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHsl(r, g, b) {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === rf) h = (gf - bf) / d + (gf < bf ? 6 : 0);
  else if (max === gf) h = (bf - rf) / d + 2;
  else h = (rf - gf) / d + 4;

  return [h / 6, s, l];
}

// Converts a single hex color (the "Ink Color" control) to {h,s,l} — used
// for monochrome mode instead of the old hardcoded near-black.
export function hexToHsl(hex) {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  return { h, s, l };
}

// Samples a gradient's hex stops at t (0-1), linearly interpolating RGB
// between the two nearest stops, and converts to {h,s,l} — the shape
// testGenerator.js's bundle.color already uses (THREE.Color.setHSL takes
// fractional h/s/l), so swapping random-hue for a palette sample doesn't
// need any change downstream in the render components.
export function sampleGradientHsl(colors, t) {
  const clampedT = Math.max(0, Math.min(1, t));
  const scaled = clampedT * (colors.length - 1);
  const i0 = Math.floor(scaled);
  const i1 = Math.min(colors.length - 1, i0 + 1);
  const localT = scaled - i0;

  const c0 = hexToRgb(colors[i0]);
  const c1 = hexToRgb(colors[i1]);
  const r = c0[0] + (c1[0] - c0[0]) * localT;
  const g = c0[1] + (c1[1] - c0[1]) * localT;
  const b = c0[2] + (c1[2] - c0[2]) * localT;

  const [h, s, l] = rgbToHsl(r, g, b);
  return { h, s, l };
}
