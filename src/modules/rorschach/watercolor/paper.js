import * as THREE from 'three/webgpu';

import createRng, { combineSeed } from '../rng';

const PAPER_SALT = 'paper';
const BASE_LATTICE = 8;

// Value noise rather than a texture file: the paper has to be byte-identical
// in the browser and in the headless capture, and it has to follow the seed
// like everything else in a test does. A fetched image would be neither.
function valueNoise(rng, size) {
  const lattice = new Float32Array(size * size);
  for (let i = 0; i < lattice.length; i += 1) lattice[i] = rng();
  return lattice;
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function sampleLattice(lattice, size, x, y) {
  const fx = x * size;
  const fy = y * size;
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const tx = smoothstep(fx - x0);
  const ty = smoothstep(fy - y0);
  const ix0 = ((x0 % size) + size) % size;
  const iy0 = ((y0 % size) + size) % size;
  const ix1 = (ix0 + 1) % size;
  const iy1 = (iy0 + 1) % size;

  const a = lattice[iy0 * size + ix0];
  const b = lattice[iy0 * size + ix1];
  const c = lattice[iy1 * size + ix0];
  const d = lattice[iy1 * size + ix1];
  return (
    a * (1 - tx) * (1 - ty) +
    b * tx * (1 - ty) +
    c * (1 - tx) * ty +
    d * tx * ty
  );
}

// Curtis's paper is a height field h plus a per-cell fluid capacity c. Height
// drives granulation (pigment settles in the valleys) and the capillary layer's
// capacity; the sim reads both every step, so it lives in one RGBA texture:
// (h, c, 0, 0).
//
// Mirrored across the vertical axis on purpose. A Rorschach blot is symmetric
// because the paper was folded, which means the *fibres* are symmetric too —
// an unmirrored grain would break the symmetry of every wet edge and the blot
// would stop reading as folded.
export function createPaperTexture({
  capacityScale = 0.9,
  grain = 0.5,
  octaves = 4,
  resolution = 512,
  seed = 0,
} = {}) {
  const rng = createRng(combineSeed(seed, PAPER_SALT));
  const lattices = [];
  for (let octave = 0; octave < octaves; octave += 1) {
    lattices.push(valueNoise(rng, BASE_LATTICE * 2 ** octave));
  }

  const data = new Float32Array(resolution * resolution * 4);
  const half = resolution / 2;

  for (let y = 0; y < resolution; y += 1) {
    for (let x = 0; x < resolution; x += 1) {
      const mirroredX = x < half ? x : resolution - 1 - x;
      const u = mirroredX / resolution;
      const v = y / resolution;

      let amplitude = 1;
      let total = 0;
      let normalizer = 0;
      lattices.forEach((lattice, octave) => {
        const size = BASE_LATTICE * 2 ** octave;
        total += sampleLattice(lattice, size, u, v) * amplitude;
        normalizer += amplitude;
        amplitude *= 0.5;
      });

      const height = 1 - grain + (total / normalizer) * grain;
      const index = (y * resolution + x) * 4;
      data[index] = height;
      data[index + 1] = height * capacityScale;
    }
  }

  const texture = new THREE.DataTexture(
    data,
    resolution,
    resolution,
    THREE.RGBAFormat,
    THREE.FloatType
  );
  texture.needsUpdate = true;
  return texture;
}

export default createPaperTexture;
