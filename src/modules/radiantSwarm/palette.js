import { Color } from 'three';

import {
  getPaletteStops,
  rgbToColor,
  samplePaletteColors,
} from '@utils/gradientPalette';

// Palette colours differ in luminance by up to ~3.5x, so at one Light Output a
// violet emitter genuinely puts out a third of what a cyan one does — it reads
// as "that colour isn't emissive". Match Brightness scales each toward the
// palette's mean luminance so intensity means the same thing whatever the hue.
export default function buildPalette(config) {
  const stops = getPaletteStops(config.paletteName);
  const colors = stops
    ? samplePaletteColors(stops, 4, config.paletteExact).map((rgb) =>
        rgbToColor(rgb, new Color())
      )
    : [config.colorA, config.colorB, config.colorC, config.colorD].map(
        (hex) => new Color(hex)
      );

  const luminance = colors.map(
    (c) => c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722
  );
  const mean = luminance.reduce((a, b) => a + b, 0) / luminance.length;

  return colors.map((color, i) => {
    const scale = luminance[i] > 1e-4 ? mean / luminance[i] : 1;
    return color.multiplyScalar(1 + (scale - 1) * config.matchBrightness);
  });
}

export function paletteKey(config) {
  return [
    config.colorA,
    config.colorB,
    config.colorC,
    config.colorD,
    config.matchBrightness,
    config.paletteExact,
    config.paletteName,
  ].join('|');
}
