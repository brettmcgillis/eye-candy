import { samplePalette } from '@utils/paletteStops';

import { clamp } from './math';

export const COLOR_SOURCES = ['trap', 'depth', 'radius', 'height'];

const WEIGHT_KEYS = {
  depth: 'colorDepth',
  height: 'colorHeight',
  radius: 'colorRadius',
  trap: 'colorTrap',
};

// The blend of colour sources, before the palette coordinate is applied.
// `p` is in object space; radius and height read the unit bound.
export function colorSource({ depth, trap }, p, config) {
  const values = {
    depth,
    height: clamp(p[1] * 0.5 + 0.5, 0, 1),
    radius: clamp(Math.hypot(p[0], p[1], p[2]), 0, 1),
    trap,
  };
  let sum = 0;
  let total = 0;
  COLOR_SOURCES.forEach((name) => {
    const w = config[WEIGHT_KEYS[name]];
    sum += values[name] * w;
    total += w;
  });
  return total > 0 ? sum / total : 0;
}

// Repeat and shift, then the LUT's mirrored wrap folded on the CPU, then
// reverse. The TSL twin is apollianRender's paletteCoordinate.
export function paletteCoordinate(t, config) {
  const raw = t * config.paletteRepeat + config.paletteShift;
  const m = raw - 2 * Math.floor(raw / 2);
  const folded = m > 1 ? 2 - m : m;
  return config.paletteReverse ? 1 - folded : folded;
}

export default function colorAt(t, config, stops) {
  return samplePalette(
    stops,
    paletteCoordinate(t, config),
    config.paletteExact
  ).map((v) => v / 255);
}
