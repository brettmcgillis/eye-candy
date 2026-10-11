import * as THREE from 'three';

import { mulberry32, valueNoise2 } from '@utils/noise2d';

function craterProfile(d, depth, rim) {
  const bowl = d < 1 ? (d * d - 1) * depth : 0;
  const lip = rim * Math.exp(-(((d - 1) / 0.28) ** 2));
  return bowl + lip;
}

export default function buildLunarTerrain({
  clearRadius,
  craterCount,
  curvatureRadius,
  maxCraterRadius,
  roughness,
  seed,
  segments,
  size,
}) {
  const random = mulberry32(seed);
  const noise = (x, z) => valueNoise2(x, z, seed) - 0.5;
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  const { position } = geometry.attributes;
  const { count } = position;
  const heights = new Float32Array(count);
  const stride = segments + 1;
  const cell = size / segments;
  const half = size / 2;

  for (let i = 0; i < count; i += 1) {
    const x = position.getX(i);
    const z = position.getZ(i);
    heights[i] =
      roughness *
        (2.2 * noise(x / 48, z / 48) +
          0.9 * noise(x / 17, z / 17) +
          0.3 * noise(x / 6, z / 6)) -
      (x * x + z * z) / (2 * curvatureRadius);
  }

  for (let c = 0; c < craterCount; c += 1) {
    const radius = 1.2 + (maxCraterRadius - 1.2) * random() ** 3.2;
    const cx = (random() - 0.5) * size;
    const cz = (random() - 0.5) * size;
    const depth = radius * (0.16 + random() * 0.08);
    const rim = radius * (0.04 + random() * 0.04);
    const clear = Math.hypot(cx, cz) >= radius + clearRadius;
    const reach = radius * 1.8;
    const minCol = Math.max(0, Math.floor((cx - reach + half) / cell));
    const maxCol = Math.min(segments, Math.ceil((cx + reach + half) / cell));
    const minRow = Math.max(0, Math.floor((cz - reach + half) / cell));
    const maxRow = Math.min(segments, Math.ceil((cz + reach + half) / cell));
    for (let row = minRow; row <= maxRow; row += 1) {
      for (let col = minCol; col <= maxCol; col += 1) {
        const i = row * stride + col;
        const d =
          Math.hypot(position.getX(i) - cx, position.getZ(i) - cz) / radius;
        if (clear && d < 1.8) heights[i] += craterProfile(d, depth, rim);
      }
    }
  }

  const centre =
    heights[Math.floor(segments / 2) * stride + Math.floor(segments / 2)];
  for (let i = 0; i < count; i += 1) position.setY(i, heights[i] - centre);

  geometry.computeVertexNormals();
  return geometry;
}
