export const QUANT = 65535;
export const MAX_BATCH_POINTS = 256;

export const quantize = (unit) =>
  Math.round(Math.min(1, Math.max(0, unit)) * QUANT);

export function sanitizePoints(points, maxPoints = MAX_BATCH_POINTS) {
  if (!Array.isArray(points)) return null;
  if (points.length < 2 || points.length % 2 || points.length > maxPoints * 2)
    return null;
  const valid = points.every(
    (value) => Number.isInteger(value) && value >= 0 && value <= QUANT
  );
  return valid ? points : null;
}

export function clamp(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}
