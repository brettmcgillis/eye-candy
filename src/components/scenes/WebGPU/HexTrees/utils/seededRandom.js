/* eslint-disable no-bitwise */
// Small self-contained seeded PRNG (mulberry32) — scene-local copy, same
// pattern as DigitalRain/utils/seededNoise2D.js. Not shared across scenes
// (scene-conventions.md §6): every scene that needs one copies this ~10-line
// body rather than importing a common module for it.
export default function createSeededRandom(seed) {
  let a = seed >>> 0;
  return function random() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
