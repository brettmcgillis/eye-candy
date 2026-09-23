/* eslint-disable no-bitwise */
// Deterministic PRNG shared by the blob field's own generation (packing
// severance draws from David Bau's seedrandom via withSeededRandom instead)
// and its render-side lane colouring, which needs a seeded stream that is
// stable independent of Math.random(). Ported from the scene's utils/grid.js,
// which still owns its own copy for the square/triangular grid modes.
export default function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
