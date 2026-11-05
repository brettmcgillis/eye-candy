/* eslint-disable no-bitwise */
// The Hair turtle's Noise class (turtletoy.net/turtle/36d793188c), drawn
// from a seeded rng in place of Math.random. `noise2d` and `noise` are the
// reference line for line; `noise3d` is the same lattice with a third axis.

const lerp = (t, a, b) => a + t * (b - a);

const grad2d = (i, x, y) => {
  const v = (i & 1) === 0 ? x : y;
  return (i & 2) === 0 ? -v : v;
};

const grad3d = (i, x, y, z) => {
  const axis = i % 3;
  let v = z;
  if (axis === 0) v = x;
  else if (axis === 1) v = y;
  return (i & 4) === 0 ? -v : v;
};

export default function createNoise(rng, octaves = 1) {
  const p = new Uint8Array(512);
  for (let i = 0; i < 512; i += 1) p[i] = rng() * 256;

  function noise2d(x2d, y2d) {
    const X = Math.floor(x2d) & 255;
    const Y = Math.floor(y2d) & 255;
    const x = x2d - Math.floor(x2d);
    const y = y2d - Math.floor(y2d);
    const fx = (3 - 2 * x) * x * x;
    const fy = (3 - 2 * y) * y * y;
    const p0 = p[X] + Y;
    const p1 = p[X + 1] + Y;
    return lerp(
      fy,
      lerp(fx, grad2d(p[p0], x, y), grad2d(p[p1], x - 1, y)),
      lerp(fx, grad2d(p[p0 + 1], x, y - 1), grad2d(p[p1 + 1], x - 1, y - 1))
    );
  }

  function noise3d(x3d, y3d, z3d) {
    const X = Math.floor(x3d) & 255;
    const Y = Math.floor(y3d) & 255;
    const Z = Math.floor(z3d) & 255;
    const x = x3d - Math.floor(x3d);
    const y = y3d - Math.floor(y3d);
    const z = z3d - Math.floor(z3d);
    const fx = (3 - 2 * x) * x * x;
    const fy = (3 - 2 * y) * y * y;
    const fz = (3 - 2 * z) * z * z;
    const a = p[X] + Y;
    const b = p[X + 1] + Y;
    const aa = p[a] + Z;
    const ab = p[a + 1] + Z;
    const ba = p[b] + Z;
    const bb = p[b + 1] + Z;
    const g = (k, dx, dy, dz) => grad3d(p[k], x - dx, y - dy, z - dz);
    return lerp(
      fz,
      lerp(
        fy,
        lerp(fx, g(aa, 0, 0, 0), g(ba, 1, 0, 0)),
        lerp(fx, g(ab, 0, 1, 0), g(bb, 1, 1, 0))
      ),
      lerp(
        fy,
        lerp(fx, g(aa + 1, 0, 0, 1), g(ba + 1, 1, 0, 1)),
        lerp(fx, g(ab + 1, 0, 1, 1), g(bb + 1, 1, 1, 1))
      )
    );
  }

  const fbm = (sample) => {
    let e = 1;
    let k = 1;
    let s = 0;
    for (let i = 0; i < octaves; i += 1) {
      e *= 0.5;
      s += (e * (1 + sample(k))) / 2;
      k *= 2;
    }
    return s;
  };

  return {
    noise: (x, y) => fbm((k) => noise2d(k * x, k * y)),
    noise3: (x, y, z) => fbm((k) => noise3d(k * x, k * y, k * z)),
  };
}
