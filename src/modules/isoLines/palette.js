import { hexToRgb, samplePalette } from '@utils/paletteStops';

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// The colour at field value t, sRGB 0..1 — the CPU twin of the rig's shader
// colour, for the plot SVG's pens. cosine is the reference's
// .5 + .5·cos(12n + (0, 2.1, -2.1)).
export default function colorAt(t, config, stops = null) {
  if (config.colorMode === 'palette' && stops?.length) {
    return samplePalette(stops, t, config.paletteExact).map((c) => c / 255);
  }
  if (config.colorMode === 'ramp') {
    const low = hexToRgb(config.rampLow);
    const high = hexToRgb(config.rampHigh);
    return low.map((c, i) => (c + (high[i] - c) * clamp01(t)) / 255);
  }
  const x = config.cosineFreq * t + config.cosinePhase;
  const s = config.cosineSpread;
  return [x, x + s, x - s].map((a) => 0.5 + 0.5 * Math.cos(a));
}

// A line's colour: its level's, pulled toward the line colour by lineTint.
export function lineColorAt(t, config, stops = null) {
  const base = colorAt(t, config, stops);
  const tint = hexToRgb(config.lineColor).map((c) => c / 255);
  return base.map((c, i) => c + (tint[i] - c) * config.lineTint);
}
