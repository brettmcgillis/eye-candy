export const gray = (v) => [v, v, v];

const level = (v) => Math.round((v / 255) * 255);

export const p5Color = (rgb) => rgb.map(level);

export function lerpColor(from, to, amount) {
  const t = Math.max(0, Math.min(1, amount));
  return from.map((f, n) => {
    const a = f / 255;
    return level((t * (to[n] / 255 - a) + a) * 255);
  });
}

const CMYK_STEPS = {
  0: 0,
  1: 0.13,
  2: 0.2,
  3: 0.3,
  4: 0.4,
  5: 0.5,
  6: 0.6,
  7: 0.7,
  A: 0.08,
  X: 1,
};

export function cmyk(code) {
  const [c, m, y, k] = [...code].map((ch) => CMYK_STEPS[ch] ?? 0);
  return p5Color([
    255 * (1 - c) * (1 - k),
    255 * (1 - m) * (1 - k),
    255 * (1 - y) * (1 - k),
  ]);
}

const hex2 = (v) =>
  Math.max(0, Math.min(255, Math.round(v)))
    .toString(16)
    .padStart(2, '0');

export const toHex = ([r, g, b]) => `#${hex2(r)}${hex2(g)}${hex2(b)}`;
