import {
  PALETTE_NAMES as GRADIENT_PALETTE_NAMES,
  getPaletteStops,
  hexToRgb,
  pickStop,
  sampleStops,
} from '@utils/gradientPalette';
import GRADIENTS from '@utils/gradients.json';

// Leva "Palette" dropdown options — 'Random' (existing per-bundle random hue
// behavior) plus every named gradient in the shared gradients.json.
export const GRADIENT_NAMES = GRADIENT_PALETTE_NAMES;
export const PALETTE_NAMES = ['Random', ...GRADIENT_NAMES];

// Fewer than four stops is a two-colour ramp, not a palette. The ink samples
// four pigment slots across the gradient and the Lines layer samples one stop
// per bundle, so a two-stop entry gives both layers almost nothing to traverse
// — and with `paletteExact` it collapses to literally two colours across every
// slot.
//
// This is a big cut: 373 of the 423 gradients have three stops or fewer, so the
// dice draw from 50. Deliberately applied to the roll only. A name the roll
// will not choose is still a name worth choosing on purpose, so PALETTE_NAMES
// keeps the full library for the dropdowns and for `--palette`.
const MIN_ROLL_STOPS = 4;

export const ROLLABLE_GRADIENT_NAMES = GRADIENTS.filter(
  (g) => g.colors.length >= MIN_ROLL_STOPS
).map((g) => g.name);

export function resolvePaletteColors(paletteName) {
  if (!paletteName || paletteName === 'Random') return null;
  return getPaletteStops(paletteName);
}

// Gamma-space luma, not linearized relative luminance — utils/rollConfig.js
// compares this against a background it also picks in gamma space, so both
// sides of that contrast test have to be measured the same way.
export function hexLuminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
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

// Inverse of hexToHsl — used to pre-fill the Bundle Editor's Color field
// with a bundle's actual current color (whatever computeStyles produced)
// when its Override folder is first opened, instead of a fixed placeholder.
export function hslToHex(h, s, l) {
  if (s === 0) {
    const v = Math.round(l * 255);
    return `#${[v, v, v].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hueToRgb = (t0) => {
    let t = t0;
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const r = Math.round(hueToRgb(h + 1 / 3) * 255);
  const g = Math.round(hueToRgb(h) * 255);
  const b = Math.round(hueToRgb(h - 1 / 3) * 255);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export function sampleGradientHsl(colors, t) {
  const [h, s, l] = rgbToHsl(...sampleStops(colors, t));
  return { h, s, l };
}

export function pickGradientColorHsl(colors, t) {
  const [h, s, l] = rgbToHsl(...pickStop(colors, t));
  return { h, s, l };
}
