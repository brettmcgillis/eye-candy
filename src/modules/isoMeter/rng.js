/* eslint-disable no-bitwise */
const LCG_M = 4294967296;
const LCG_A = 1664525;
const LCG_C = 1013904223;

export function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

export function sfc32(seedA, seedB, seedC, seedD) {
  let a = seedA;
  let b = seedB;
  let c = seedC;
  let d = seedD;
  return () => {
    a |= 0;
    b |= 0;
    c |= 0;
    d |= 0;
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

export function createHlRandom({ hash, tokenId = '', curated = false }) {
  const seed = xmur3(curated ? hash : `${hash}${tokenId}`);
  const random = (...args) => {
    let min = 0;
    let max = 1;
    if (args.length === 1) [max] = args;
    if (args.length === 2) [min, max] = args;
    return min + (max - min) * sfc32(seed(), seed(), seed(), seed())();
  };
  const randomInt = (...args) => {
    if (args.length === 0) return Math.floor(random(101));
    if (args.length === 1) return Math.floor(random(args[0] + 1));
    return Math.floor(random(args[0], args[1] + 1));
  };
  return {
    random,
    randomBool: (p) => random() < p,
    randomElement: (array) => array[randomInt(0, array.length - 1)],
    randomInt,
  };
}

export function createLcg(seed) {
  let state = seed >>> 0;
  const next = () => {
    state = (LCG_A * state + LCG_C) % LCG_M;
    return state / LCG_M;
  };
  const random = (min, max) => {
    const rand = next();
    if (min === undefined) return rand;
    if (max === undefined) return rand * min;
    const lo = Math.min(min, max);
    return rand * (Math.max(min, max) - lo) + lo;
  };
  return {
    next,
    random,
    randomInt: (a, b) => Math.floor(random(a, b + 1)),
    seed: (value) => {
      state = value >>> 0;
    },
  };
}

export function randomHash(random = Math.random) {
  const alphabet = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i += 1) hash += alphabet[(random() * 16) | 0];
  return hash;
}
