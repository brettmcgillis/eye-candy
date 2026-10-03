/* eslint-disable no-bitwise */
import { hexToRgb, samplePalette } from '@utils/paletteStops';

const f32 = Math.fround;

// three's TSL `hash` (pcg, after shadertoy XlGcRh) bit for bit, including the
// float-to-uint truncation of its seed, so a plot SVG's pens are the colours
// the shader picked.
export function shaderHash(seed) {
  const state =
    (Math.imul(Math.trunc(seed) >>> 0, 747796405) + 2891336453) >>> 0;
  const word =
    Math.imul(((state >>> ((state >>> 28) + 4)) ^ state) >>> 0, 277803737) >>>
    0;
  return f32(((word >>> 22) ^ word) >>> 0) / 2 ** 32;
}

export const randomTone = (id, seed) =>
  shaderHash(f32(f32(f32(id) * f32(12.9898)) + f32(seed)));

// What a painted target shows at palette spot `t`, in sRGB 0-255, or its own
// colour when it is not painted.
export function createPainter(config, stops) {
  return (enabled, base, t) =>
    enabled && stops
      ? samplePalette(stops, Math.min(Math.max(t, 0), 1), config.paletteExact)
      : hexToRgb(base);
}
