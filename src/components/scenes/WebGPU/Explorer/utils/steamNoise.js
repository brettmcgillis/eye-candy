import * as THREE from 'three/webgpu';

import { mulberry32 } from '@utils/noise2d';

// The steam's erosion noise, baked once into a tileable 3D texture: one
// hardware-filtered fetch per march step instead of a 2-octave gradient noise,
// which measured as half the cost of the whole steam pass.
//
// Value-noise fbm for the soft body, minus Worley for the billows — the usual
// cloud recipe. Every octave's lattice period divides SIZE, so it tiles.
const SIZE = 64;
const CELLS = 8;

function randomValues(count, seed) {
  const random = mulberry32(seed);
  return Float32Array.from({ length: count }, random);
}

function valueNoise(lattice, period, x, y, z) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const sz = fz * fz * (3 - 2 * fz);

  const at = (dx, dy, dz) =>
    lattice[
      ((ix + dx) % period) +
        ((iy + dy) % period) * period +
        ((iz + dz) % period) * period * period
    ];

  const lerp = (a, b, t) => a + (b - a) * t;
  return lerp(
    lerp(
      lerp(at(0, 0, 0), at(1, 0, 0), sx),
      lerp(at(0, 1, 0), at(1, 1, 0), sx),
      sy
    ),
    lerp(
      lerp(at(0, 0, 1), at(1, 0, 1), sx),
      lerp(at(0, 1, 1), at(1, 1, 1), sx),
      sy
    ),
    sz
  );
}

function worley(points, period, x, y, z) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  let nearest = Infinity;

  for (let dz = -1; dz <= 1; dz += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const cx = ix + dx;
        const cy = iy + dy;
        const cz = iz + dz;
        const w = (v) => ((v % period) + period) % period;
        const k = (w(cx) + w(cy) * period + w(cz) * period * period) * 3;
        const px = cx + points[k] - x;
        const py = cy + points[k + 1] - y;
        const pz = cz + points[k + 2] - z;
        nearest = Math.min(nearest, px * px + py * py + pz * pz);
      }
    }
  }

  return Math.min(Math.sqrt(nearest), 1);
}

export default function createSteamNoise() {
  const octaves = [
    { amp: 0.5, lattice: randomValues(CELLS ** 3, 11), period: CELLS },
    {
      amp: 0.3,
      lattice: randomValues((CELLS * 2) ** 3, 23),
      period: CELLS * 2,
    },
    {
      amp: 0.2,
      lattice: randomValues((CELLS * 4) ** 3, 37),
      period: CELLS * 4,
    },
  ];
  const points = randomValues((CELLS * 2) ** 3 * 3, 59);
  const data = new Uint8Array(SIZE ** 3);

  for (let z = 0; z < SIZE; z += 1) {
    for (let y = 0; y < SIZE; y += 1) {
      for (let x = 0; x < SIZE; x += 1) {
        let fbm = 0;
        octaves.forEach(({ amp, lattice, period }) => {
          const f = period / SIZE;
          fbm += amp * valueNoise(lattice, period, x * f, y * f, z * f);
        });

        const f = (CELLS * 2) / SIZE;
        const billow = 1 - worley(points, CELLS * 2, x * f, y * f, z * f);
        const value = THREE.MathUtils.clamp(fbm * 0.6 + billow * 0.4, 0, 1);

        data[x + y * SIZE + z * SIZE * SIZE] = Math.round(value * 255);
      }
    }
  }

  const texture = new THREE.Data3DTexture(data, SIZE, SIZE, SIZE);
  texture.format = THREE.RedFormat;
  texture.type = THREE.UnsignedByteType;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.wrapR = THREE.RepeatWrapping;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;

  return texture;
}

// One texture tile spans CELLS base-octave cells, so this keeps Noise Scale
// meaning "cells per unit" whatever the bake resolution is.
export const NOISE_TILE = 1 / CELLS;
