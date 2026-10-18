import { GENERATOR_KEYS } from '@modules/isoMeter';
import { getPaletteStops } from '@utils/gradientPalette';

export const generatorKey = (config) =>
  GENERATOR_KEYS.map((name) => config[name]).join('|');

export const stopsFor = (config) =>
  config.palette && config.palette !== 'None'
    ? getPaletteStops(config.palette)
    : null;
