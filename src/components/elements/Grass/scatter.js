/* eslint-disable no-continue */
import { hash01, mulberry32 } from '@utils/noise2d';

import { commitGrassStore } from './grassStore';

const ROOT_SINK = 0.02;

function clumpCenter(x, z, clumpSize, seed) {
  const cellX = Math.floor(x / clumpSize);
  const cellZ = Math.floor(z / clumpSize);
  return {
    cellX,
    cellZ,
    x:
      (cellX + 0.5 + (hash01(cellX, cellZ, seed + 11) - 0.5) * 0.8) * clumpSize,
    z:
      (cellZ + 0.5 + (hash01(cellX, cellZ, seed + 23) - 0.5) * 0.8) * clumpSize,
  };
}

function writeClump(clump, index, center, x, z, clumpSize, clumpSeed, bend) {
  const dx = center.x - x;
  const dz = center.z - z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  const closeness = Math.max(0, 1 - dist / clumpSize);
  const invDist = dist > 1e-5 ? 1 / dist : 0;
  clump.set(
    [dx * invDist * closeness, dz * invDist * closeness, clumpSeed, bend],
    index * 4
  );
}

// sample(x, z) -> null to reject, or { height, scale } for ground height and blade-scale multiplier.
export function scatterGrid(
  store,
  { centerX = 0, centerZ = 0, clumpSize, count, sample, seed, size }
) {
  const offsets = store.offsetAttribute.array;
  const data = store.dataAttribute.array;
  const clump = store.clumpAttribute.array;
  const placedMax = Math.min(count, store.maxCount);
  const safeClumpSize = Math.max(clumpSize, 1e-3);
  const half = size / 2;
  const minX = centerX - half;
  const maxX = centerX + half;
  const minZ = centerZ - half;
  const maxZ = centerZ + half;

  const cellSize = Math.max(size / Math.sqrt(placedMax), 0.05);
  const minCellX = Math.floor(minX / cellSize) - 1;
  const maxCellX = Math.ceil(maxX / cellSize) + 1;
  const minCellZ = Math.floor(minZ / cellSize) - 1;
  const maxCellZ = Math.ceil(maxZ / cellSize) + 1;

  let placed = 0;
  for (let gz = minCellZ; gz <= maxCellZ && placed < placedMax; gz += 1) {
    for (let gx = minCellX; gx <= maxCellX && placed < placedMax; gx += 1) {
      const worldX = (gx + hash01(gx, gz, seed + 101)) * cellSize;
      const worldZ = (gz + hash01(gx, gz, seed + 211)) * cellSize;
      if (worldX < minX || worldX > maxX || worldZ < minZ || worldZ > maxZ) {
        continue;
      }

      const ground = sample(worldX, worldZ);
      if (!ground) {
        continue;
      }

      const center = clumpCenter(worldX, worldZ, safeClumpSize, seed);
      offsets[placed * 3] = worldX - centerX;
      offsets[placed * 3 + 1] = ground.height - ROOT_SINK;
      offsets[placed * 3 + 2] = worldZ - centerZ;
      data[placed * 4] = hash01(gx, gz, seed + 307) * Math.PI * 2;
      data[placed * 4 + 1] =
        (0.7 + hash01(gx, gz, seed + 401) * 0.6) * ground.scale;
      data[placed * 4 + 2] = hash01(gx, gz, seed + 503);
      data[placed * 4 + 3] = hash01(gx, gz, seed + 601);
      writeClump(
        clump,
        placed,
        center,
        worldX,
        worldZ,
        safeClumpSize,
        hash01(center.cellX, center.cellZ, seed + 701),
        hash01(gx, gz, seed + 809)
      );
      placed += 1;
    }
  }

  return commitGrassStore(store, placed);
}

export function scatterRejection(
  store,
  { clumpPull, clumpSize, count, half, sample, seed }
) {
  const offsets = store.offsetAttribute.array;
  const data = store.dataAttribute.array;
  const clump = store.clumpAttribute.array;
  const rng = mulberry32(seed * 7919 + count);
  const target = Math.min(count, store.maxCount);
  const maxAttempts = target * 30;
  const pull = Math.min(clumpPull, 0.25);

  let placed = 0;
  for (
    let attempt = 0;
    attempt < maxAttempts && placed < target;
    attempt += 1
  ) {
    let x = (rng() * 2 - 1) * half;
    let z = (rng() * 2 - 1) * half;
    const center = clumpCenter(x, z, clumpSize, seed);
    x += (center.x - x) * pull;
    z += (center.z - z) * pull;

    const ground = sample(x, z);
    if (!ground) {
      continue;
    }

    offsets[placed * 3] = x;
    offsets[placed * 3 + 1] = ground.height - ROOT_SINK;
    offsets[placed * 3 + 2] = z;
    data[placed * 4] = rng() * Math.PI * 2;
    data[placed * 4 + 1] = (0.7 + rng() * 0.6) * ground.scale;
    data[placed * 4 + 2] = rng();
    data[placed * 4 + 3] = rng();
    writeClump(
      clump,
      placed,
      center,
      x,
      z,
      clumpSize,
      hash01(center.cellX, center.cellZ, seed),
      rng()
    );
    placed += 1;
  }

  return commitGrassStore(store, placed);
}

export function scatterDisk(
  store,
  { avoid = [], count, radius, scaleBase = 0.7, scaleJitter = 0.6, seed }
) {
  const offsets = store.offsetAttribute.array;
  const data = store.dataAttribute.array;
  const rand = mulberry32(seed);
  const target = Math.min(count, store.maxCount);
  const maxAttempts = target * 30;

  let placed = 0;
  for (
    let attempt = 0;
    attempt < maxAttempts && placed < target;
    attempt += 1
  ) {
    const r = radius * Math.sqrt(rand());
    const a = rand() * Math.PI * 2;
    const x = r * Math.cos(a);
    const z = r * Math.sin(a);
    if (avoid.some((o) => Math.hypot(x - o.x, z - o.z) < o.r)) {
      continue;
    }
    const edge = 1 - Math.max(0, (r / radius - 0.75) / 0.25);
    offsets[placed * 3] = x;
    offsets[placed * 3 + 1] = 0;
    offsets[placed * 3 + 2] = z;
    data[placed * 4] = rand() * Math.PI * 2;
    data[placed * 4 + 1] = (scaleBase + rand() * scaleJitter) * edge;
    placed += 1;
  }

  return commitGrassStore(store, placed);
}
