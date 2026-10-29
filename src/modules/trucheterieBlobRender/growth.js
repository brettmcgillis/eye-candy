import { max, smoothstep } from 'three/tsl';

export const revealDepth = (family) =>
  family.lane.div(max(family.lanes.sub(1), 1));

export function growthMask(
  family,
  growthU,
  delay,
  depth = revealDepth(family)
) {
  const local = growthU.sub(delay.mul(0.6)).div(0.4).clamp(0, 1.5);
  const threshold = depth.mul(0.55).add(family.sweep.mul(0.45));
  return smoothstep(threshold.sub(0.03), threshold.add(0.03), local);
}
