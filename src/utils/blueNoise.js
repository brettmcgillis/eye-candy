import { mulberry32 } from './noise2d';

function toroidalGaussian(size, sigma) {
  const kernel = new Float64Array(size * size);
  const half = size / 2;
  for (let y = 0; y < size; y += 1) {
    const dy = y > half ? y - size : y;
    for (let x = 0; x < size; x += 1) {
      const dx = x > half ? x - size : x;
      kernel[y * size + x] = Math.exp(
        -(dx * dx + dy * dy) / (2 * sigma * sigma)
      );
    }
  }
  return kernel;
}

function createEnergyField(size, sigma) {
  const kernel = toroidalGaussian(size, sigma);
  const energy = new Float64Array(size * size);
  const splat = (index, sign) => {
    const px = index % size;
    const py = Math.floor(index / size);
    for (let y = 0; y < size; y += 1) {
      const ky = ((y - py + size) % size) * size;
      const row = y * size;
      for (let x = 0; x < size; x += 1) {
        energy[row + x] += sign * kernel[ky + ((x - px + size) % size)];
      }
    }
  };
  return { energy, splat };
}

function extremum(pattern, energy, wantOn, pickMax) {
  let best = -1;
  let bestEnergy = pickMax ? -Infinity : Infinity;
  for (let i = 0; i < pattern.length; i += 1) {
    if (pattern[i] === wantOn) {
      const e = energy[i];
      if (pickMax ? e > bestEnergy : e < bestEnergy) {
        bestEnergy = e;
        best = i;
      }
    }
  }
  return best;
}

// Ulichney's void-and-cluster. Returns a size*size array of ranks normalized
// to [0, 1): a dither threshold map whose every level is evenly spread.
export default function createBlueNoise(
  size = 64,
  { sigma = 1.5, seed = 1 } = {}
) {
  const count = size * size;
  const random = mulberry32(seed);
  const pattern = new Uint8Array(count);
  const field = createEnergyField(size, sigma);
  const toggle = (index, on) => {
    pattern[index] = on ? 1 : 0;
    field.splat(index, on ? 1 : -1);
  };

  let ones = 0;
  const initialOnes = Math.floor(count / 10);
  while (ones < initialOnes) {
    const index = Math.floor(random() * count);
    if (!pattern[index]) {
      toggle(index, true);
      ones += 1;
    }
  }

  for (;;) {
    const cluster = extremum(pattern, field.energy, 1, true);
    toggle(cluster, false);
    const gap = extremum(pattern, field.energy, 0, false);
    toggle(gap, true);
    if (gap === cluster) break;
  }

  const prototype = pattern.slice();
  const prototypeEnergy = field.energy.slice();
  const rank = new Float32Array(count);

  for (let r = ones - 1; r >= 0; r -= 1) {
    const cluster = extremum(pattern, field.energy, 1, true);
    toggle(cluster, false);
    rank[cluster] = r;
  }

  pattern.set(prototype);
  field.energy.set(prototypeEnergy);
  for (let r = ones; r < count; r += 1) {
    const gap = extremum(pattern, field.energy, 0, false);
    toggle(gap, true);
    rank[gap] = r;
  }

  return rank.map((value) => value / count);
}
