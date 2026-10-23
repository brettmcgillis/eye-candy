// CPU mirrors of MaterialX 3D Perlin and fractal noise. Integer hashes match
// the GPU exactly; interpolation uses doubles rather than shader f32.

/* eslint-disable no-bitwise */
const rotl = (x, k) => ((x << k) | (x >>> (32 - k))) >>> 0;

function bjfinal(a0, b0, c0) {
  let a = a0 >>> 0;
  let b = b0 >>> 0;
  let c = c0 >>> 0;
  c = ((c ^ b) - rotl(b, 14)) >>> 0;
  a = ((a ^ c) - rotl(c, 11)) >>> 0;
  b = ((b ^ a) - rotl(a, 25)) >>> 0;
  c = ((c ^ b) - rotl(b, 16)) >>> 0;
  a = ((a ^ c) - rotl(c, 4)) >>> 0;
  b = ((b ^ a) - rotl(a, 14)) >>> 0;
  c = ((c ^ b) - rotl(b, 24)) >>> 0;
  return c;
}

const SEED3 = (0xdeadbeef + (3 << 2) + 13) >>> 0;

const hash3 = (x, y, z) =>
  bjfinal((SEED3 + x) >>> 0, (SEED3 + y) >>> 0, (SEED3 + z) >>> 0);

function gradient(hash, x, y, z) {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  let v = z;
  if (h < 4) v = y;
  else if (h === 12 || h === 14) v = x;
  return (h & 1 ? -u : u) + (h & 2 ? -v : v);
}

/* eslint-enable no-bitwise */

const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);

export function perlin3(px, py, pz) {
  const X = Math.floor(px);
  const Y = Math.floor(py);
  const Z = Math.floor(pz);
  const fx = px - X;
  const fy = py - Y;
  const fz = pz - Z;
  const u = fade(fx);
  const v = fade(fy);
  const w = fade(fz);
  const g = (dx, dy, dz) =>
    gradient(hash3(X + dx, Y + dy, Z + dz), fx - dx, fy - dy, fz - dz);
  const s1 = 1 - u;
  const t1 = 1 - v;
  const r1 = 1 - w;
  const result =
    r1 *
      (t1 * (g(0, 0, 0) * s1 + g(1, 0, 0) * u) +
        v * (g(0, 1, 0) * s1 + g(1, 1, 0) * u)) +
    w *
      (t1 * (g(0, 0, 1) * s1 + g(1, 0, 1) * u) +
        v * (g(0, 1, 1) * s1 + g(1, 1, 1) * u));
  return 0.982 * result;
}

export function fractal3(x, y, z, octaves, lacunarity, diminish) {
  let result = 0;
  let amplitude = 1;
  let px = x;
  let py = y;
  let pz = z;
  for (let i = 0; i < octaves; i += 1) {
    result += amplitude * perlin3(px, py, pz);
    amplitude *= diminish;
    px *= lacunarity;
    py *= lacunarity;
    pz *= lacunarity;
  }
  return result;
}
