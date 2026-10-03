import { smoothstep } from './math';

// Sébastien Durand's keyframed pseudo-kleinian (2017, CC BY-NC-SA 3.0), the
// fractal half of its timeline: the box fold's mins and maxs. Every array
// ends back on its first key; maxsy is one short in the original, which
// reads past its end, so it closes on its first value like the others.
const MINS_X = [
  -0.3252, -0.3252, -0.3252, -0.3252, -0.3252, -0.3252, -1.05, -1.05, -1.21,
  -1.22, -1.04, -0.737, -0.62, -10, -0.653, -0.653, -0.3252,
];
const MINS_Y = [
  -0.7862, -0.7862, -0.7862, -0.7862, -0.7862, -0.7862, -1.05, -1.05, -0.954,
  -1.17, -0.79, -0.73, -0.71, -0.75, -2, -2, -0.7862,
];
const MINS_Z = [
  -0.0948, -0.0948, -0.0948, -0.0948, -0.0948, -0.0948, -0.0001, -0.0001,
  -0.0001, -0.032, -0.126, -1.23, -0.85, -0.787, -0.822, -1.073, -0.0948,
];
const MINS_W = [
  0.69, 0.69, 0.69, 0.69, 0.69, 0.678, 0.7, 0.73, 1.684, 1.49, 0.833, 0.627,
  0.77, 0.826, 1.8976, 1.8899, 0.69,
];
const MAXS_X = [
  0.35, 0.3457, 0.3457, 0.3457, 0.3457, 0.3457, 1.05, 1.05, 0.39, 0.85, 0.3457,
  0.73, 0.72, 5, 0.888, 0.735, 0.35,
];
const MAXS_Y = [
  1, 1.0218, 1.0218, 1.0218, 1.0218, 1.0218, 1.05, 1.05, 0.65, 0.65, 1.0218,
  0.73, 0.74, 1.67, 0.1665, 1, 1,
];
const MAXS_Z = [
  1.22, 1.2215, 1.2215, 1.2215, 1.2215, 1.2215, 1.27, 1.4, 1.27, 1.27, 1.2215,
  0.73, 0.74, 0.775, 1.2676, 1.22, 1.22,
];
const MAXS_W = [
  0.84, 0.84, 0.84, 0.84, 0.84, 0.9834, 0.95, 0.93, 2.74, 1.23, 0.9834, 0.8335,
  0.14, 1.172, 0.7798, 0.84, 0.84,
];

export const KLEINIAN_KEY_COUNT = 16;

// Durand's `kt = smoothstep(0, 1, fract(t))` between whole keys.
export default function kleinianParams(key) {
  const k =
    ((key % KLEINIAN_KEY_COUNT) + KLEINIAN_KEY_COUNT) % KLEINIAN_KEY_COUNT;
  const i0 = Math.floor(k);
  const t = smoothstep(0, 1, k - i0);
  const at = (list) => list[i0] + (list[i0 + 1] - list[i0]) * t;
  return {
    maxs: [at(MAXS_X), at(MAXS_Y), at(MAXS_Z), at(MAXS_W)],
    mins: [at(MINS_X), at(MINS_Y), at(MINS_Z), at(MINS_W)],
  };
}
