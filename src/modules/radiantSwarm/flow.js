/* eslint-disable no-bitwise, no-param-reassign */
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

function hash3(ix, iy, iz, seed) {
  let h =
    Math.imul(ix, 374761393) +
    Math.imul(iy, 668265263) +
    Math.imul(iz, 2147483647) +
    Math.imul(seed, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}

function valueNoise3(x, y, z, seed) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const fz = smooth(z - iz);

  const lerp = (a, b, f) => a + (b - a) * f;
  const plane = (k) =>
    lerp(
      lerp(hash3(ix, iy, k, seed), hash3(ix + 1, iy, k, seed), fx),
      lerp(hash3(ix, iy + 1, k, seed), hash3(ix + 1, iy + 1, k, seed), fx),
      fy
    );

  return lerp(plane(iz), plane(iz + 1), fz);
}

function fbm3(x, y, z, seed) {
  return (
    valueNoise3(x, y, z, seed) * 0.57 +
    valueNoise3(x * 2, y * 2, z * 2, seed + 101) * 0.29 +
    valueNoise3(x * 4, y * 4, z * 4, seed + 202) * 0.14
  );
}

// Same two scrolling layers as the 2D potential, one per component of a
// vector potential, so a volume and a plane at one Curl Scale move at the
// same grain.
function potential3(axis, x, y, z, t, scale) {
  const seed = 7 + axis * 31;

  return (
    fbm3(x * scale + t * 0.13, y * scale, z * scale, seed) +
    fbm3(
      x * scale * 2.1 - t * 0.07,
      y * scale * 2.1,
      z * scale * 2.1,
      seed + 12
    ) *
      0.5
  );
}

function derivative(axis, wrt, x, y, z, t, scale) {
  const ex = wrt === 0 ? EPS : 0;
  const ey = wrt === 1 ? EPS : 0;
  const ez = wrt === 2 ? EPS : 0;

  return (
    (potential3(axis, x + ex, y + ey, z + ez, t, scale) -
      potential3(axis, x - ex, y - ey, z - ez, t, scale)) /
    (2 * EPS)
  );
}

export function curlFlow3(out, x, y, z, t, scale) {
  const vx =
    derivative(2, 1, x, y, z, t, scale) - derivative(1, 2, x, y, z, t, scale);
  const vy =
    derivative(0, 2, x, y, z, t, scale) - derivative(2, 0, x, y, z, t, scale);
  const vz =
    derivative(1, 0, x, y, z, t, scale) - derivative(0, 1, x, y, z, t, scale);
  const len = Math.hypot(vx, vy, vz) || 1;

  out[0] = vx / len;
  out[1] = vy / len;
  out[2] = vz / len;
  return out;
}
