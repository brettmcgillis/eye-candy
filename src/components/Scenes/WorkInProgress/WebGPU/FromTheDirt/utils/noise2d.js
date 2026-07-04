/* eslint-disable no-bitwise */

// Deterministic CPU-side 2D value noise + FBM. The heightfield is baked on
// the CPU so terrain displacement (GPU), grass placement (CPU), and the
// strata shading all agree on the exact same heights.

function hash2(ix, iz, seed) {
  let h =
    Math.imul(ix, 374761393) +
    Math.imul(iz, 668265263) +
    Math.imul(seed, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

// Exposed for grid-cell hashing (grass clump seeds).
export function hash01(ix, iz, seed) {
  return hash2(ix, iz, seed);
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}

export function valueNoise2(x, z, seed) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = smooth(x - ix);
  const fz = smooth(z - iz);
  const a = hash2(ix, iz, seed);
  const b = hash2(ix + 1, iz, seed);
  const c = hash2(ix, iz + 1, seed);
  const d = hash2(ix + 1, iz + 1, seed);
  const top = a + (b - a) * fx;
  const bottom = c + (d - c) * fx;
  return top + (bottom - top) * fz;
}

// Returns 0..1.
export function fbm2(x, z, { seed = 1, octaves = 4, gain = 0.5 } = {}) {
  let amplitude = 1;
  let frequency = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i += 1) {
    sum +=
      amplitude * valueNoise2(x * frequency, z * frequency, seed + i * 101);
    norm += amplitude;
    amplitude *= gain;
    frequency *= 2;
  }
  return sum / norm;
}

// Small seeded RNG for repeatable grass scatter.
export function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
