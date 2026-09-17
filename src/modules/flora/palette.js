const SCHEMES = ['preset', 'mono', 'analogous', 'complementary', 'drift'];

export default function rollPalette(p, rng) {
  const amount = p.paletteVariation;
  const shift = (spread) => rng.signed() * spread * amount;
  const scheme =
    rng() < amount
      ? SCHEMES[1 + Math.floor(rng() * (SCHEMES.length - 1))]
      : 'preset';

  return {
    flip: rng() < amount * 0.5,
    pick: rng(),
    windowSpan: 1 - rng() * 0.5 * amount,
    windowStart: rng() * 0.35 * amount,
    drift:
      scheme === 'drift' ? rng.range(0.6, 1.8) * (rng() < 0.5 ? -1 : 1) : 0,
    formHue: amount * rng.range(0.15, 0.9),
    hue: shift(0.12),
    light: 1 + shift(0.22),
    saturation: 1 + shift(0.35),
    scheme,
  };
}
