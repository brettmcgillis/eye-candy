// Growth: every tube vertex carries the 0..1 moment it appears (buildTubes'
// `grow`), so a clip only drives one reveal value. It runs past 1 by a
// sliver so the last tips finish rounding, holds, then loops.
const TIP = 0.04;

export const growClipSeconds = (config) =>
  config.growSeconds + config.holdSeconds;

export default function growAt(seconds, config, { loop = true } = {}) {
  const span = growClipSeconds(config);
  const t = loop && span > 0 ? seconds % span : seconds;
  return Math.min(
    1 + TIP,
    (t / Math.max(config.growSeconds, 1e-3)) * (1 + TIP)
  );
}

export const inflateClipSeconds = (config) =>
  config.inflateSeconds + config.deflateSeconds;

// The membrane's target pressure: on for inflateSeconds, then off, looped
// under `inflate` motion; held on otherwise. The solver eases toward it.
export function pressureAt(seconds, config, { cycle = true } = {}) {
  if (!cycle) return config.membranePressure;
  const span = inflateClipSeconds(config);
  const t = span > 0 ? seconds % span : 0;
  return t < config.inflateSeconds ? config.membranePressure : 0;
}
