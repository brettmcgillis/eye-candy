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

// One axis of a lattice sample, for every coordinate on that axis at once: the
// wrapped pair of lattice indices and the blend between them. Both axes are a
// fixed ramp over the same `resolution` positions, so this is computed once per
// octave rather than four million times per octave — the only reason the paper
// took two seconds to build.
function latticeAxis(size, count) {
  const lo = new Int32Array(count);
  const hi = new Int32Array(count);
  const t = new Float64Array(count);
  for (let i = 0; i < count; i += 1) {
    const f = (i / count) * size;
    const floor = Math.floor(f);
    t[i] = smoothstep(f - floor);
    lo[i] = ((floor % size) + size) % size;
    hi[i] = (lo[i] + 1) % size;
  }
  return { hi, lo, t };
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
export function writePaperData(
  target,
  {
    capacityScale = 0.9,
    grain = 0.5,
    octaves = 4,
    resolution = 512,
    seed = 0,
  } = {}
) {
  const data = target;
  const rng = createRng(combineSeed(seed, PAPER_SALT));
  const lattices = [];
  for (let octave = 0; octave < octaves; octave += 1) {
    lattices.push(valueNoise(rng, BASE_LATTICE * 2 ** octave));
  }

  // Half the sheet, then mirrored — the grain is symmetric by construction, so
  // computing the right half is computing the left half twice.
  const half = Math.ceil(resolution / 2);
  // One table per octave, read for both axes: u and v are the same ramp over
  // the same number of positions, so x and y index it identically.
  const axes = lattices.map((lattice, octave) => {
    const size = BASE_LATTICE * 2 ** octave;
    return { axis: latticeAxis(size, resolution), lattice, size };
  });
  const normalizer = axes.reduce(
    (sum, unused, octave) => sum + 0.5 ** octave,
    0
  );

  for (let y = 0; y < resolution; y += 1) {
    for (let mirroredX = 0; mirroredX < half; mirroredX += 1) {
      let amplitude = 1;
      let total = 0;
      for (let octave = 0; octave < axes.length; octave += 1) {
        const { axis, lattice, size } = axes[octave];
        const tx = axis.t[mirroredX];
        const ty = axis.t[y];
        const rowLo = axis.lo[y] * size;
        const rowHi = axis.hi[y] * size;
        const a = lattice[rowLo + axis.lo[mirroredX]];
        const b = lattice[rowLo + axis.hi[mirroredX]];
        const c = lattice[rowHi + axis.lo[mirroredX]];
        const d = lattice[rowHi + axis.hi[mirroredX]];
        total +=
          (a * (1 - tx) * (1 - ty) +
            b * tx * (1 - ty) +
            c * (1 - tx) * ty +
            d * tx * ty) *
          amplitude;
        amplitude *= 0.5;
      }

      const height = 1 - grain + (total / normalizer) * grain;
      const capacity = height * capacityScale;
      const left = (y * resolution + mirroredX) * 4;
      const right = (y * resolution + resolution - 1 - mirroredX) * 4;
      data[left] = height;
      data[left + 1] = capacity;
      data[right] = height;
      data[right + 1] = capacity;
    }
  }
  return data;
}

export function createPaperTexture(options = {}) {
  const resolution = options.resolution ?? 512;
  const texture = new THREE.DataTexture(
    writePaperData(new Float32Array(resolution * resolution * 4), options),
    resolution,
    resolution,
    THREE.RGBAFormat,
    THREE.FloatType
  );
  texture.needsUpdate = true;
  return texture;
}

export default createPaperTexture;
