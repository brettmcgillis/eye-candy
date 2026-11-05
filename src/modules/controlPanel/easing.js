export const clamp01 = (x) => Math.min(Math.max(x, 0), 1);
export const smooth = (x) => x * x * (3 - 2 * x);
export const easeInCubic = (x) => x * x * x;

// Pulls back a little before it goes and overshoots a little before it
// lands; `c` sets how far.
export function easeInOutBack(x, c) {
  const k = c * 1.525;
  if (x < 0.5) return ((2 * x) ** 2 * ((k + 1) * 2 * x - k)) / 2;
  return ((2 * x - 2) ** 2 * ((k + 1) * (2 * x - 2) + k) + 2) / 2;
}

// Arrives fast, overshoots by about `c` / 10 and settles.
export const easeOutBack = (x, c) =>
  1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2;
