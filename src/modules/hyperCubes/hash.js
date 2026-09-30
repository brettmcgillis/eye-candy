/* eslint-disable no-bitwise */
const f = Math.fround;

// The rect reference's `fs`, in the GPU's f32 steps. A shader's sin of a large
// argument is vendor-defined, so this matches Shadertoy in kind, not bit for bit.
export function fs(x) {
  const v = f(f(Math.sin(f(f(x) * f(114.514)))) * f(1919.81));
  return f(v - Math.floor(v));
}

const floatBits = new Float32Array(1);
const uintBits = new Uint32Array(floatBits.buffer);

function floatBitsToUint(v) {
  floatBits[0] = v;
  return uintBits[0];
}

// The octree reference's pcg3d: integer arithmetic, so this is exact.
export function pcg3d(sx, sy, sz) {
  let x = (Math.imul(sx, 1145141919) + 1919810) >>> 0;
  let y = (Math.imul(sy, 1145141919) + 1919810) >>> 0;
  let z = (Math.imul(sz, 1145141919) + 1919810) >>> 0;

  x = (x + Math.imul(y, z)) >>> 0;
  y = (y + Math.imul(z, x)) >>> 0;
  z = (z + Math.imul(x, y)) >>> 0;

  x = (x ^ (x >>> 16)) >>> 0;
  y = (y ^ (y >>> 16)) >>> 0;
  z = (z ^ (z >>> 16)) >>> 0;

  x = (x + Math.imul(y, z)) >>> 0;
  y = (y + Math.imul(z, x)) >>> 0;
  z = (z + Math.imul(x, y)) >>> 0;

  return [x, y, z];
}

const UINT_MAX = f(4294967295);

export function pcg3df(v) {
  return pcg3d(...v.map((c) => floatBitsToUint(f(c)))).map((r) =>
    f(f(r) / UINT_MAX)
  );
}
