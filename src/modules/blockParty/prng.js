/* eslint-disable no-bitwise */
const MULTIPLIER = 16807;
const MODULUS = 0x7fffffff;
const DIVISOR = 1 / 0x7fffffff;

function nextLongRand(seed) {
  let lo = MULTIPLIER * (seed & 0xffff);
  const hi = MULTIPLIER * (seed >> 16);

  lo += (hi & 0x7fff) << 16;

  if (lo > MODULUS) {
    lo &= MODULUS;
    lo += 1;
  }

  lo += hi >> 15;

  if (lo > MODULUS) {
    lo &= MODULUS;
    lo += 1;
  }

  return lo;
}

// The reference draws from one Lehmer stream, so the ORDER of random() calls
// is part of the composition — reordering them changes the city even at the
// same seed.
export default function createPrng(seed) {
  let state = seed <= 0 ? 1 : seed;

  return () => {
    state = nextLongRand(state);
    return state * DIVISOR;
  };
}
