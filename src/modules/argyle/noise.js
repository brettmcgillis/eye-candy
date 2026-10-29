/* eslint-disable no-bitwise */
import { createRng } from '@modules/flora';

const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const mix = (a, b, t) => a + (b - a) * t;
function grad(hash, x, y, z) {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  let v = z;
  if (h < 4) v = y;
  else if (h === 12 || h === 14) v = x;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}
export default function createNoise(seed) {
  const rng = createRng(seed);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  const perm = Uint16Array.from({ length: 512 }, (_, i) => p[i & 255]);
  return (x, y, z) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iz = Math.floor(z);
    const X = ix & 255;
    const Y = iy & 255;
    const Z = iz & 255;
    const a = x - ix;
    const b = y - iy;
    const c = z - iz;
    const u = fade(a);
    const v = fade(b);
    const w = fade(c);
    const A = perm[X] + Y;
    const B = perm[X + 1] + Y;
    const AA = perm[A] + Z;
    const AB = perm[A + 1] + Z;
    const BA = perm[B] + Z;
    const BB = perm[B + 1] + Z;
    return mix(
      mix(
        mix(grad(perm[AA], a, b, c), grad(perm[BA], a - 1, b, c), u),
        mix(grad(perm[AB], a, b - 1, c), grad(perm[BB], a - 1, b - 1, c), u),
        v
      ),
      mix(
        mix(
          grad(perm[AA + 1], a, b, c - 1),
          grad(perm[BA + 1], a - 1, b, c - 1),
          u
        ),
        mix(
          grad(perm[AB + 1], a, b - 1, c - 1),
          grad(perm[BB + 1], a - 1, b - 1, c - 1),
          u
        ),
        v
      ),
      w
    );
  };
}
