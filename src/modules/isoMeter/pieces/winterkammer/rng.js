/* eslint-disable no-bitwise */
import { sfc32 } from '../../rng';

const streamOf = (hex) =>
  sfc32(
    parseInt(hex.substring(0, 8), 16),
    parseInt(hex.substring(8, 16), 16),
    parseInt(hex.substring(16, 24), 16),
    parseInt(hex.substring(24, 32), 16)
  );

const withHelpers = (roll) => ({
  randomFloatRange: (a, b) => a + b * roll(),
  randomIntExcl: (n) => Math.floor(n * roll()),
  randomIntRangeIncl: (a, b) => Math.floor(a + (b + 1) * roll()),
  roll,
});

export function createMasterRng(hash) {
  const prngA = streamOf(hash.substring(2, 34));
  const prngB = streamOf(hash.substring(34, 66));
  for (let t = 0; t < 1e6; t += 2) {
    prngA();
    prngB();
  }
  let useA = false;
  const roll = () => {
    useA = !useA;
    return useA ? prngA() : prngB();
  };
  return {
    ...withHelpers(roll),
    randomSeed: () => Math.floor(1e9 * roll()),
  };
}

const N = 624;
const M = 397;
const MATRIX_A = 2567483615;
const UPPER_MASK = 2147483648;
const LOWER_MASK = 2147483647;
const MAG = [0, MATRIX_A];

export function createTileRng(seedValue) {
  const mt = new Uint32Array(N);
  let mti = N + 1;
  mt[0] = seedValue >>> 0;
  for (mti = 1; mti < N; mti += 1) {
    const t = mt[mti - 1] ^ (mt[mti - 1] >>> 30);
    mt[mti] =
      (((1812433253 * ((4294901760 & t) >>> 16)) << 16) +
        1812433253 * (65535 & t) +
        mti) >>>
      0;
  }

  const int32 = () => {
    let t;
    if (mti >= N) {
      let s;
      for (s = 0; s < N - M; s += 1) {
        t = (mt[s] & UPPER_MASK) | (mt[s + 1] & LOWER_MASK);
        mt[s] = mt[s + M] ^ (t >>> 1) ^ MAG[1 & t];
      }
      for (; s < N - 1; s += 1) {
        t = (mt[s] & UPPER_MASK) | (mt[s + 1] & LOWER_MASK);
        mt[s] = mt[s + (M - N)] ^ (t >>> 1) ^ MAG[1 & t];
      }
      t = (mt[N - 1] & UPPER_MASK) | (mt[0] & LOWER_MASK);
      mt[N - 1] = mt[M - 1] ^ (t >>> 1) ^ MAG[1 & t];
      mti = 0;
    }
    t = mt[mti];
    mti += 1;
    t ^= t >>> 11;
    t ^= (t << 7) & 2636928640;
    t ^= (t << 15) & 4022730752;
    t ^= t >>> 18;
    return t >>> 0;
  };

  const roll = () => {
    const hi = int32() >>> 5;
    const lo = int32() >>> 6;
    return (67108864 * hi + lo) / 9007199254740992;
  };

  return withHelpers(roll);
}
