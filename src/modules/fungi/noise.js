/* eslint-disable no-bitwise */
function hash2(x, y, seed) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + seed;

  h = Math.imul(h ^ (h >>> 13), 1274126177);

  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const fade = (t) => t * t * (3 - 2 * t);

// Smooth value noise in -1..1, seeded so a specimen's wobble is repeatable.
export default function createNoise(seed) {
  const s = Math.floor(seed * 1e6) | 0;

  function noise2(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const u = fade(x - xi);
    const v = fade(y - yi);
    const a = hash2(xi, yi, s);
    const b = hash2(xi + 1, yi, s);
    const c = hash2(xi, yi + 1, s);
    const d = hash2(xi + 1, yi + 1, s);

    return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
  }

  const noise1 = (x, lane = 0) => noise2(x, lane * 17.13);

  function fbm(x, y, octaves = 3) {
    let sum = 0;
    let amp = 0.5;
    let f = 1;

    for (let o = 0; o < octaves; o += 1) {
      sum += noise2(x * f, y * f) * amp;
      f *= 2.03;
      amp *= 0.5;
    }

    return sum;
  }

  return { fbm, noise1, noise2 };
}
