import { createRng } from '@modules/flora';

const GRADIENTS = [
  [1, 1, 0],
  [-1, 1, 0],
  [1, -1, 0],
  [-1, -1, 0],
  [1, 0, 1],
  [-1, 0, 1],
  [1, 0, -1],
  [-1, 0, -1],
  [0, 1, 1],
  [0, -1, 1],
  [0, 1, -1],
  [0, -1, -1],
];

const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + (b - a) * t;

// Improved Perlin noise over a seeded permutation, in [-1, 1].
export function createNoise(seed) {
  const rng = createRng(`noise:${seed}`);
  const base = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i += 1) perm[i] = base[i % 256];

  const grad = (hash, x, y, z) => {
    const g = GRADIENTS[hash % 12];
    return g[0] * x + g[1] * y + g[2] * z;
  };

  function noise(x, y, z) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    const X = xi % 256 < 0 ? (xi % 256) + 256 : xi % 256;
    const Y = yi % 256 < 0 ? (yi % 256) + 256 : yi % 256;
    const Z = zi % 256 < 0 ? (zi % 256) + 256 : zi % 256;
    const fx = x - xi;
    const fy = y - yi;
    const fz = z - zi;
    const u = fade(fx);
    const v = fade(fy);
    const w = fade(fz);
    const A = perm[X] + Y;
    const AA = perm[A] + Z;
    const AB = perm[A + 1] + Z;
    const B = perm[X + 1] + Y;
    const BA = perm[B] + Z;
    const BB = perm[B + 1] + Z;
    return lerp(
      lerp(
        lerp(grad(perm[AA], fx, fy, fz), grad(perm[BA], fx - 1, fy, fz), u),
        lerp(
          grad(perm[AB], fx, fy - 1, fz),
          grad(perm[BB], fx - 1, fy - 1, fz),
          u
        ),
        v
      ),
      lerp(
        lerp(
          grad(perm[AA + 1], fx, fy, fz - 1),
          grad(perm[BA + 1], fx - 1, fy, fz - 1),
          u
        ),
        lerp(
          grad(perm[AB + 1], fx, fy - 1, fz - 1),
          grad(perm[BB + 1], fx - 1, fy - 1, fz - 1),
          u
        ),
        v
      ),
      w
    );
  }

  function fbm(x, y, z, octaves = 4) {
    let sum = 0;
    let amplitude = 0.5;
    let frequency = 1;
    let norm = 0;
    for (let o = 0; o < octaves; o += 1) {
      sum += noise(x * frequency, y * frequency, z * frequency) * amplitude;
      norm += amplitude;
      amplitude *= 0.5;
      frequency *= 2.03;
    }
    return sum / norm;
  }

  // Three decorrelated channels: a displacement field.
  function vector(x, y, z, octaves = 3) {
    return [
      fbm(x, y, z, octaves),
      fbm(x + 31.4, y - 17.1, z + 5.9, octaves),
      fbm(x - 12.7, y + 41.3, z - 23.5, octaves),
    ];
  }

  // Divergence-free flow from the curl of `vector`.
  function curl(x, y, z, e = 0.05) {
    const dx = (a, b) => (a - b) / (2 * e);
    const px = vector(x + e, y, z, 2);
    const nx = vector(x - e, y, z, 2);
    const py = vector(x, y + e, z, 2);
    const ny = vector(x, y - e, z, 2);
    const pz = vector(x, y, z + e, 2);
    const nz = vector(x, y, z - e, 2);
    return [
      dx(py[2], ny[2]) - dx(pz[1], nz[1]),
      dx(pz[0], nz[0]) - dx(px[2], nx[2]),
      dx(px[1], nx[1]) - dx(py[0], ny[0]),
    ];
  }

  return { curl, fbm, noise, vector };
}

/* eslint-disable no-bitwise */
// A stateless die for (seed, a, b, salt): which edges a partial rule keeps.
export function hashUnit(seed, a, b = 0, salt = 0) {
  let h = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  h = Math.imul(h ^ (a + 0x7f4a7c15), 0xc2b2ae35);
  h = Math.imul(h ^ (b + 0x165667b1), 0x27d4eb2f);
  h = Math.imul(h ^ (salt + 0x2545f491), 0x9e3779b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}
/* eslint-enable no-bitwise */
