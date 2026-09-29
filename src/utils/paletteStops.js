export function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [Math.floor(n / 65536) % 256, Math.floor(n / 256) % 256, n % 256];
}

export function rgbToHex(rgb) {
  return `#${rgb
    .map((c) =>
      Math.round(Math.max(0, Math.min(255, c)))
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;
}

const clamp01 = (t) => Math.max(0, Math.min(1, t));

export function sampleStops(stops, t) {
  const scaled = clamp01(t) * (stops.length - 1);
  const lower = Math.floor(scaled);
  const upper = Math.min(lower + 1, stops.length - 1);
  const blend = scaled - lower;
  const a = hexToRgb(stops[lower]);
  const b = hexToRgb(stops[upper]);
  return a.map((c, i) => c + (b[i] - c) * blend);
}

export function pickStop(stops, t) {
  return hexToRgb(stops[Math.round(clamp01(t) * (stops.length - 1))]);
}

export function samplePalette(stops, t, exact = false) {
  return exact ? pickStop(stops, t) : sampleStops(stops, t);
}

export function samplePaletteColors(stops, count, exact = false) {
  return Array.from({ length: count }, (_, i) =>
    samplePalette(stops, count > 1 ? i / (count - 1) : 0, exact)
  );
}
