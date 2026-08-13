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
