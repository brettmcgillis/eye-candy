import { hexToRgb } from '@utils/gradientPalette';

// three's ACESFilmicToneMapping (nodes/display/ToneMappingFunctions.js) on
// the CPU, for output that never passes through the renderer — the SVG. The
// scene's canvas and the headless capture both tone-map every colour, so a
// vector written from the raw config colours reads lighter and flatter than
// the raster beside it.
const INPUT = [
  0.59719, 0.35458, 0.04823, 0.076, 0.90834, 0.01566, 0.0284, 0.13383, 0.83777,
];
const OUTPUT = [
  1.60475, -0.53108, -0.07367, -0.10208, 1.10813, -0.00605, -0.00327, -0.07276,
  1.07602,
];

const toLinear = (c) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const toSrgb = (c) =>
  c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
const multiply = (m, v) =>
  [0, 1, 2].map(
    (r) => m[r * 3] * v[0] + m[r * 3 + 1] * v[1] + m[r * 3 + 2] * v[2]
  );
const fit = (v) =>
  (v * (v + 0.0245786) - 0.000090537) /
  (v * (0.983729 * v + 0.432951) + 0.238081);

export function acesFilmic(rgb, exposure = 1) {
  const linear = rgb.map((c) => (toLinear(c / 255) * exposure) / 0.6);
  return multiply(OUTPUT, multiply(INPUT, linear).map(fit)).map((c) =>
    Math.round(toSrgb(Math.min(1, Math.max(0, c))) * 255)
  );
}

export function acesFilmicHex(hex, exposure = 1) {
  return `#${acesFilmic(hexToRgb(hex), exposure)
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`;
}
