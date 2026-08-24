/* eslint-disable no-bitwise */
// LCG, same algorithm as elements/logo/growth/seededRng.js — deterministic
// per seed so a test reproduces exactly. Kept as a plain function (not that
// file's class) since every call site here just wants a `() => float`
// generator to pass around and reseed independently (formula builder,
// bundle generation, evolution each get their own stream).
export default function createRng(seed) {
  let state = seed >>> 0 || 1;

  return function rng() {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

// Hash-combines a base seed with extra integer parts (bundle index, reroll
// nonce, ...) into one deterministic seed — lets each bundle own an
// independent RNG stream instead of sharing one sequential stream across the
// whole beast (see testGenerator.js). That independence is what makes
// "reroll bundle 3 only" possible without perturbing every other bundle's
// shape, since none of them read from a shared cursor anymore.
export function combineSeed(seed, ...parts) {
  let h = seed >>> 0 || 1;
  parts.forEach((part) => {
    h = Math.imul(h ^ (part >>> 0), 2654435761) >>> 0;
    h = (h ^ (h >>> 15)) >>> 0;
  });
  return h;
}
