/* eslint-disable no-bitwise */
export function hashSeed(value) {
  let h = 2166136261;
  String(value)
    .split('')
    .forEach((char) => {
      h = Math.imul(h ^ char.charCodeAt(0), 16777619);
    });
  return h >>> 0;
}

export function mix(a, b) {
  let h = Math.imul(a ^ (b + 0x9e3779b9), 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

export function createRng(seed) {
  let state = typeof seed === 'number' ? seed >>> 0 : hashSeed(seed);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
