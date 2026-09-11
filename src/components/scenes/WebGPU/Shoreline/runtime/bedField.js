import * as THREE from 'three';

import { fbm2, mulberry32, valueNoise2 } from '@utils/noise2d';

import { RESOLUTION, WORLD_SIZE } from './constants';

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function ridged(x, z, seed, octaves) {
  return 1 - Math.abs(fbm2(x, z, { seed, octaves }) * 2 - 1);
}

// One CPU bake drives everything: the terrain mesh's vertices, the solver's
// bathymetry and the shading's waterline. Sampling the same array rather than
// re-evaluating the noise per consumer is what keeps them from drifting apart.
export default function buildBedField(config) {
  const {
    boulderCount,
    deepDepth,
    rockRelief,
    shoreHeight,
    shoreSeed,
    slopeCurve,
    surfWidth,
  } = config;

  const n = RESOLUTION;
  const heights = new Float32Array(n * n);
  const random = mulberry32(shoreSeed + 1);

  // Placed in shore-fraction space rather than world z, so moving the surf
  // zone moves the rocks with it.
  const boulders = Array.from({ length: boulderCount }, () => ({
    height: shoreHeight * (0.5 + random() * 1.6),
    radius: WORLD_SIZE * (0.012 + random() * 0.055),
    x: (random() - 0.5) * WORLD_SIZE * 0.85,
    z: (0.5 - (0.15 + random() * surfWidth)) * WORLD_SIZE,
  }));

  for (let j = 0; j < n; j += 1) {
    const worldZ = (0.5 - j / (n - 1)) * WORLD_SIZE;
    for (let i = 0; i < n; i += 1) {
      const worldX = (i / (n - 1) - 0.5) * WORLD_SIZE;
      const t = j / (n - 1);

      let height = -deepDepth + (deepDepth + shoreHeight) * t ** slopeCurve;

      const reliefMask = smoothstep(0.15, 0.95, t);
      const ridge = ridged(worldX * 0.11, worldZ * 0.11, shoreSeed, 5);
      height += (ridge ** 3 - 0.2) * rockRelief * reliefMask;
      height +=
        (valueNoise2(worldX * 0.55, worldZ * 0.55, shoreSeed + 7) - 0.5) *
        rockRelief *
        0.3 *
        reliefMask;

      for (let b = 0; b < boulders.length; b += 1) {
        const boulder = boulders[b];
        const dx = (worldX - boulder.x) / boulder.radius;
        const dz = (worldZ - boulder.z) / boulder.radius;
        const falloff = Math.exp(-((dx * dx + dz * dz) ** 1.4) * 1.9);
        height +=
          boulder.height *
          falloff *
          (0.7 + 0.6 * ridged(worldX * 0.3, worldZ * 0.3, shoreSeed + b, 3));
      }

      heights[j * n + i] = height;
    }
  }

  const texture = new THREE.DataTexture(
    heights,
    n,
    n,
    THREE.RedFormat,
    THREE.FloatType
  );
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  return { heights, texture };
}
