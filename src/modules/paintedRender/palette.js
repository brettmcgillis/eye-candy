import {
  getPaletteStops,
  rgbToHex,
  samplePaletteColors,
} from '@utils/gradientPalette';

export default function paintPaletteColors(config) {
  if (!config.paintFollowPalette) return null;
  const name = [
    config.paletteName,
    config.blobPalette,
    config.ringsPalette,
  ].find((value) => getPaletteStops(value));
  const stops = getPaletteStops(name);
  return stops
    ? samplePaletteColors(
        stops,
        3,
        name === config.ringsPalette && name !== config.paletteName
          ? (config.ringsPaletteExact ?? false)
          : (config.paletteExact ?? false)
      ).map(rgbToHex)
    : null;
}
