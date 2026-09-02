/* eslint-disable no-param-reassign */
import { fbm2 } from '@utils/noise2d';

// Divergence-free 2D flow: curl of a scalar potential, v = (dψ/dy, -dψ/dx).
// The potential is two fbm octaves scrolling against each other, which reads
// as an evolving field without needing a third noise dimension.
function potential(x, y, t, scale) {
  return (
    fbm2(x * scale + t * 0.13, y * scale, { octaves: 3, seed: 7 }) +
    fbm2(x * scale * 2.1 - t * 0.07, y * scale * 2.1, {
      octaves: 2,
      seed: 19,
    }) *
      0.5
  );
}

const EPS = 0.004;

export default function curlFlow(out, x, y, t, scale) {
  const dy = potential(x, y + EPS, t, scale) - potential(x, y - EPS, t, scale);
  const dx = potential(x + EPS, y, t, scale) - potential(x - EPS, y, t, scale);

  const vx = dy / (2 * EPS);
  const vy = -dx / (2 * EPS);
  const len = Math.hypot(vx, vy) || 1;

  out[0] = vx / len;
  out[1] = vy / len;
  return out;
}
