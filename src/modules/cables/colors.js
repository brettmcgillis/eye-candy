import { hexToRgb, rgbToHex, samplePalette } from '@utils/paletteStops';

const shade = (rgb, factor) =>
  rgb.map((v) => Math.min(255, Math.max(0, v * factor)));

// One sRGB hex per cable, on its own stream so a colour change never moves
// the layout.
export default function cableColors(config, count, stops, rng) {
  const sleeve = hexToRgb(config.cableColor);
  const accent = hexToRgb(config.accentColor);
  const palette = stops?.length >= 2 ? stops : null;
  return Array.from({ length: count }, (_, index) => {
    let rgb;
    if (config.colorMode === 'sweep') {
      const t = index / count;
      rgb = palette
        ? samplePalette(palette, t)
        : sleeve.map(
            (v, k) =>
              v + (accent[k] - v) * (0.5 - 0.5 * Math.cos(t * Math.PI * 2))
          );
    } else if (config.colorMode === 'mixed') {
      const roll = rng();
      if (palette) rgb = samplePalette(palette, roll, true);
      else rgb = roll < 0.5 ? sleeve : accent;
    } else {
      rgb = rng() < config.accentShare ? accent : sleeve;
    }
    const jitter = 1 + (rng() * 2 - 1) * config.shadeJitter;
    return rgbToHex(shade(rgb, jitter));
  });
}
