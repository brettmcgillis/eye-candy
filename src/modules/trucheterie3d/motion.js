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
