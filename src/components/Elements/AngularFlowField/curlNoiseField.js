/* eslint-disable no-bitwise */
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';

// Deterministic small PRNG (mulberry-style) so a given seed always builds the
// same three noise generators — lets `seed` be a stable, shareable Leva
// control rather than tied to Math.random().
function createSeededRandom(seed) {
  let state = seed >>> 0;
  if (state === 0) {
    state = 0x12345678;
  }
  return {
    random: () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 0x100000000;
    },
  };
}

function fbm(noise, nx, ny, nz, octaves, lacunarity, gain) {
  let sum = 0;
  let amplitude = 1;
  let frequency = 1;
  let normalization = 0;
  for (let octave = 0; octave < octaves; octave += 1) {
    sum +=
      noise.noise3d(nx * frequency, ny * frequency, nz * frequency) * amplitude;
    normalization += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }
  return normalization > 1e-8 ? sum / normalization : 0;
}

// Builds three independently-seeded simplex generators and returns a
// `sample(x, y, z, t, params)` closure computing a divergence-free curl-noise
// vector at that point (finite-difference curl of the vector-valued fbm
// field), with optional domain warp for extra swirl variation.
export default function createCurlNoiseField(seed) {
  const normalizedSeed = Number.isFinite(seed)
    ? Math.max(0, Math.round(seed)) >>> 0
    : 0;
  const noiseA = new SimplexNoise(
    createSeededRandom(normalizedSeed ^ 0x9e3779b9)
  );
  const noiseB = new SimplexNoise(
    createSeededRandom(normalizedSeed ^ 0x243f6a88)
  );
  const noiseC = new SimplexNoise(
    createSeededRandom(normalizedSeed ^ 0xb7e15162)
  );

  function sample(x, y, z, t, params) {
    const {
      noiseScale,
      noiseStrength,
      vorticity,
      octaves,
      lacunarity,
      gain,
      warpStrength,
      warpScale,
    } = params;
    const scale = Math.max(0.0001, noiseScale);
    const strength = Math.max(0, noiseStrength);
    const clampedOctaves = Math.max(1, Math.min(8, Math.round(octaves)));
    const epsilon = 0.01;

    const applyWarp = (nx, ny, nz) => {
      if (warpStrength <= 1e-8) {
        return { x: nx, y: ny, z: nz };
      }
      const wx = fbm(
        noiseA,
        nx * warpScale + 11.3,
        ny * warpScale - 7.1 + t * 0.29,
        nz * warpScale + 3.4,
        clampedOctaves,
        lacunarity,
        gain
      );
      const wy = fbm(
        noiseB,
        nx * warpScale - 5.8,
        ny * warpScale + 13.7,
        nz * warpScale + t * 0.41 - 9.2,
        clampedOctaves,
        lacunarity,
        gain
      );
      const wz = fbm(
        noiseC,
        nx * warpScale + t * 0.37 + 1.9,
        ny * warpScale - 4.6,
        nz * warpScale + 8.8,
        clampedOctaves,
        lacunarity,
        gain
      );
      return {
        x: nx + wx * warpStrength,
        y: ny + wy * warpStrength,
        z: nz + wz * warpStrength,
      };
    };

    const samplePotential = (nx, ny, nz) => {
      const warped = applyWarp(nx, ny, nz);
      const sx = warped.x * scale;
      const sy = warped.y * scale;
      const sz = warped.z * scale;
      return {
        x: fbm(noiseA, sy + t, sz, sx, clampedOctaves, lacunarity, gain),
        y: fbm(noiseB, sz, sx + t * 0.87, sy, clampedOctaves, lacunarity, gain),
        z: fbm(noiseC, sx, sy, sz + t * 1.13, clampedOctaves, lacunarity, gain),
      };
    };

    const y1 = samplePotential(x, y + epsilon, z);
    const y0 = samplePotential(x, y - epsilon, z);
    const z1 = samplePotential(x, y, z + epsilon);
    const z0 = samplePotential(x, y, z - epsilon);
    const x1 = samplePotential(x + epsilon, y, z);
    const x0 = samplePotential(x - epsilon, y, z);

    const twoEps = 2 * epsilon;
    const dFzDy = (y1.z - y0.z) / twoEps;
    const dFyDz = (z1.y - z0.y) / twoEps;
    const dFxDz = (z1.x - z0.x) / twoEps;
    const dFzDx = (x1.z - x0.z) / twoEps;
    const dFyDx = (x1.y - x0.y) / twoEps;
    const dFxDy = (y1.x - y0.x) / twoEps;

    return {
      x: (dFzDy - dFyDz) * strength * vorticity,
      y: (dFxDz - dFzDx) * strength * vorticity,
      z: (dFyDx - dFxDy) * strength * vorticity,
    };
  }

  return { sample };
}
