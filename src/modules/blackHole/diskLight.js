const TWO_THIRDS_PI = (Math.PI * 2) / 3;
const RING_SAMPLES = 48;
// |sin| * 0.5 + 0.5 at evenly spaced phases: the ring pattern's spread.
const PATTERN_SAMPLES = [0.598, 0.778, 0.916, 0.99];
const clamp01 = (value) => Math.min(1, Math.max(0, value));

const aces = (x) =>
  clamp01((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14));

function channel(shift, offset, lighten) {
  const base = (Math.sin(shift + offset) + 1) * 0.5;
  return (base + (1 - base) * lighten) ** 2.2;
}

export function legacyDiskRadii(config) {
  const blackHoleDiameter = config.legacyBlackHoleDiameter ?? 0.3048;
  const derivedOuter =
    (config.legacyDiskDiameter ?? 1.08) / Math.max(blackHoleDiameter, 0.0001);
  const accretionMin = config.legacyAccretionMinRadius ?? 1.5;
  const accretionWidth = config.legacyAccretionWidth ?? 5;
  const radiusScale =
    derivedOuter / Math.max(accretionMin + accretionWidth, 0.0001);
  return {
    inner: Math.max(1.05, accretionMin * radiusScale),
    outer: Math.max(2.4, derivedOuter),
  };
}

// CPU mirror of the shader's Chromatic Rings disk as it reaches the screen:
// each ring's colour through the shader's own ACES and opacity, weighted by
// ring area. Bright inner rings clip to white, so the hue comes from further out.
export default function chromaticDiskColor(config, time, target) {
  const colorSpeed = config.legacyChromaticColorSpeed ?? 0.5;
  const lighten = config.legacyChromaticSaturation ?? 0.45;
  const brightness = config.legacyDiskBrightness ?? 1;
  const { inner, outer } = legacyDiskRadii(config);
  let r = 0;
  let g = 0;
  let b = 0;

  for (let i = 0; i < RING_SAMPLES; i += 1) {
    const normalizedRadius = (i + 0.5) / RING_SAMPLES;
    const dOrig = normalizedRadius * 0.815 + 0.153;
    const fRaw = clamp01((dOrig - 0.153) * 30);
    const dInv = 1 - dOrig;
    const d0 = dInv * clamp01(dInv * 10);
    const base = fRaw * fRaw * d0 ** 1.5 * 8 * brightness;
    const shift = -time * colorSpeed + 3 + d0 * 4;
    const red = channel(shift, 0, lighten);
    const green = channel(shift, TWO_THIRDS_PI, lighten);
    const blue = channel(shift, TWO_THIRDS_PI * 2, lighten);
    const area = inner + normalizedRadius * (outer - inner);

    for (let p = 0; p < PATTERN_SAMPLES.length; p += 1) {
      const intensity = base * PATTERN_SAMPLES[p];
      const weight = clamp01(intensity) * area;
      r += aces(red * intensity) * weight;
      g += aces(green * intensity) * weight;
      b += aces(blue * intensity) * weight;
    }
  }

  const peak = Math.max(r, g, b, 1e-6);
  return target.setRGB(r / peak, g / peak, b / peak);
}
