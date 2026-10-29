import { getPaletteStops } from '@utils/paletteRegistry';
import { rgbToHex, samplePalette } from '@utils/paletteStops';

import { colorAt } from './geometry';

export default function layerColor(config, index, count) {
  let t = index / Math.max(1, count - 1);
  if (config.paletteReverse) t = 1 - t;
  const stops = getPaletteStops(config.paletteName);
  return stops
    ? rgbToHex(samplePalette(stops, t, config.paletteExact))
    : colorAt(config.colorRangeStart, config.colorRangeEnd, t);
}
