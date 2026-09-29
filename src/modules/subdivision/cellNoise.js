/* eslint-disable no-bitwise */
// A JS mirror of three's MaterialX `mx_cell_noise_float(vec2)` (Jenkins
// lookup3 `final`), so a tree split here matches fractalPixelate's on the GPU.
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

const SEED2 = (0xdeadbeef + (2 << 2) + 13) >>> 0;

export function hashInt2(x, y) {
  return bjfinal(SEED2 + (x >>> 0), SEED2 + (y >>> 0), SEED2);
}

const f32 = Math.fround;

export default function cellNoise(x, y) {
  const bits = hashInt2(Math.floor(f32(x)), Math.floor(f32(y)));
  return f32(f32(bits) / f32(0xffffffff));
}
