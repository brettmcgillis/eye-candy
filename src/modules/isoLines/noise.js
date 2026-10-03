const fract = (v) => v - Math.floor(v);

// The reference's lattice hash, constants and all (4375.5453 is theirs).
const hash3 = (x, y, z) =>
  fract(Math.sin(1e3 * (x + 57 * y - 13.7 * z)) * 4375.5453);

// IQ-style trilinear value noise with a smoothstep fade, as the reference
// Shadertoy (MdfcRS) writes it.
export function noise3(x, y, z) {
  const px = Math.floor(x);
  const py = Math.floor(y);
  const pz = Math.floor(z);
  let fx = x - px;
  let fy = y - py;
  let fz = z - pz;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  fz = fz * fz * (3 - 2 * fz);
  const v000 = hash3(px, py, pz);
  const v100 = hash3(px + 1, py, pz);
  const v010 = hash3(px, py + 1, pz);
  const v110 = hash3(px + 1, py + 1, pz);
  const v001 = hash3(px, py, pz + 1);
  const v101 = hash3(px + 1, py, pz + 1);
  const v011 = hash3(px, py + 1, pz + 1);
  const v111 = hash3(px + 1, py + 1, pz + 1);
  const x00 = v000 + (v100 - v000) * fx;
  const x10 = v010 + (v110 - v010) * fx;
  const x01 = v001 + (v101 - v001) * fx;
  const x11 = v011 + (v111 - v011) * fx;
  const y0 = x00 + (x10 - x00) * fy;
  const y1 = x01 + (x11 - x01) * fy;
  return y0 + (y1 - y0) * fz;
}

// "pseudoperlin improvement from foxes idea": two lattices half a cell apart.
export const referenceNoise = (x, y, z) =>
  (noise3(x, y, z) + noise3(x + 11.5, y + 11.5, z + 11.5)) / 2;

const KEY_SHIFT = 32768;

// noise3 on the plane z = const: the z mix of each lattice corner is
// computed once and kept, so a whole grid costs a handful of hashes per
// lattice cell instead of eight per sample. Equal to noise3 up to float
// rounding (the trilinear mix is linear in each axis).
function createNoisePlane(z) {
  const pz = Math.floor(z);
  let fz = z - pz;
  fz = fz * fz * (3 - 2 * fz);
  const cache = new Map();
  const corner = (x, y) => {
    const key = (x + KEY_SHIFT) * 65536 + (y + KEY_SHIFT);
    let w = cache.get(key);
    if (w === undefined) {
      const a = hash3(x, y, pz);
      w = a + (hash3(x, y, pz + 1) - a) * fz;
      cache.set(key, w);
    }
    return w;
  };
  let lastX = NaN;
  let lastY = NaN;
  let a = 0;
  let b = 0;
  let c = 0;
  let d = 0;
  return (x, y) => {
    const px = Math.floor(x);
    const py = Math.floor(y);
    if (px !== lastX || py !== lastY) {
      lastX = px;
      lastY = py;
      a = corner(px, py);
      b = corner(px + 1, py);
      c = corner(px, py + 1);
      d = corner(px + 1, py + 1);
    }
    let fx = x - px;
    let fy = y - py;
    fx = fx * fx * (3 - 2 * fx);
    fy = fy * fy * (3 - 2 * fy);
    const top = a + (b - a) * fx;
    return top + (c + (d - c) * fx - top) * fy;
  };
}

// referenceNoise at a fixed z, as a fast (x, y) sampler.
export function referencePlane(z) {
  const a = createNoisePlane(z);
  const b = createNoisePlane(z + 11.5);
  return (x, y) => (a(x, y) + b(x + 11.5, y + 11.5)) / 2;
}
