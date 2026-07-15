/* eslint-disable no-bitwise */
// Small self-contained seeded PRNG (mulberry32) + classic 2D gradient noise,
// standing in for ~/dev/examples/clouds's `tumult`/`seedrandom` deps (not
// worth adding two npm packages for a macro-shape noise pass) — same
// deterministic-per-seed contract, not a byte-exact port.
export function createSeededRandom(seed) {
  let a = seed >>> 0;
  return function random() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildPermutation(random) {
  const base = new Uint8Array(256);
  for (let i = 0; i < 256; i += 1) {
    base[i] = i;
  }
  for (let i = 255; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = base[i];
    base[i] = base[j];
    base[j] = tmp;
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i += 1) {
    perm[i] = base[i & 255];
  }
  return perm;
}

const GRADIENTS_2D = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
];

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function grad2(hash, x, y) {
  const [gx, gy] = GRADIENTS_2D[hash & 7];
  return gx * x + gy * y;
}

// Returns a perlin2(x, y) function producing roughly -1..1, deterministic
// for a given seed.
export function createPerlin2(seed) {
  const perm = buildPermutation(createSeededRandom(seed));

  return function perlin2(x, y) {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);

    const aa = perm[xi + perm[yi]];
    const ab = perm[xi + perm[yi + 1]];
    const ba = perm[xi + 1 + perm[yi]];
    const bb = perm[xi + 1 + perm[yi + 1]];

    const x1 = lerp(grad2(aa, xf, yf), grad2(ba, xf - 1, yf), u);
    const x2 = lerp(grad2(ab, xf, yf - 1), grad2(bb, xf - 1, yf - 1), u);
    return lerp(x1, x2, v);
  };
}
