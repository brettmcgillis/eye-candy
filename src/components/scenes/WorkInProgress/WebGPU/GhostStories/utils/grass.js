/* eslint-disable no-continue */
import * as THREE from 'three/webgpu';

import { hash01 } from '../../../../../../utils/noise2d';
import { CHUNK_SIZE } from './worldgen';

// Instanced grass, adapted from TouchGrass for an endless chunked world:
// buffers are allocated once per chunk store and refilled in place on
// rescatter; placement is a world-space jittered grid (deterministic and
// seam-free across chunks); blades hug the worldgen height sampler and
// thin out along paths and into ponds.

export const BLADE_SEGMENTS = 4;

function createBladeGeometry(segments = BLADE_SEGMENTS) {
  const rowCount = segments;
  const vertexCount = rowCount * 2 + 1;
  const indexCount = (rowCount - 1) * 6 + 3;

  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const normals = new Float32Array(vertexCount * 3);
  const indices = new Uint16Array(indexCount);

  let write = 0;
  for (let row = 0; row < rowCount; row += 1) {
    const v = row / segments;
    const left = row * 2;
    const right = left + 1;

    // Unit blade: x = ±0.5, y = 0..1. Shader applies width/height/taper.
    positions[3 * left] = -0.5;
    positions[3 * left + 1] = v;
    positions[3 * right] = 0.5;
    positions[3 * right + 1] = v;
    uvs[2 * left] = 0;
    uvs[2 * left + 1] = v;
    uvs[2 * right] = 1;
    uvs[2 * right + 1] = v;
    normals[3 * left + 2] = 1;
    normals[3 * right + 2] = 1;

    if (row > 0) {
      const prevLeft = (row - 1) * 2;
      indices[write] = prevLeft;
      indices[write + 1] = prevLeft + 1;
      indices[write + 2] = right;
      indices[write + 3] = prevLeft;
      indices[write + 4] = right;
      indices[write + 5] = left;
      write += 6;
    }
  }

  const tip = rowCount * 2;
  positions[3 * tip + 1] = 1;
  uvs[2 * tip] = 0.5;
  uvs[2 * tip + 1] = 1;
  normals[3 * tip + 2] = 1;
  const lastLeft = (rowCount - 1) * 2;
  indices[write] = lastLeft;
  indices[write + 1] = lastLeft + 1;
  indices[write + 2] = tip;

  return { indices, normals, positions, uvs };
}

export function createGrassStore(maxCount) {
  const blade = createBladeGeometry();
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setIndex(new THREE.BufferAttribute(blade.indices, 1));
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(blade.positions, 3)
  );
  geometry.setAttribute('normal', new THREE.BufferAttribute(blade.normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(blade.uvs, 2));

  // offset: xyz root position (chunk-local).
  // data:   x yaw angle, y scale, z blade seed, w phase.
  // clump:  xy direction to clump center (scaled by closeness), z clump seed,
  //         w per-blade bend randomness.
  const offsetAttribute = new THREE.InstancedBufferAttribute(
    new Float32Array(maxCount * 3),
    3
  );
  const dataAttribute = new THREE.InstancedBufferAttribute(
    new Float32Array(maxCount * 4),
    4
  );
  const clumpAttribute = new THREE.InstancedBufferAttribute(
    new Float32Array(maxCount * 4),
    4
  );
  offsetAttribute.setUsage(THREE.DynamicDrawUsage);
  dataAttribute.setUsage(THREE.DynamicDrawUsage);
  clumpAttribute.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('instanceOffset', offsetAttribute);
  geometry.setAttribute('instanceData', dataAttribute);
  geometry.setAttribute('instanceClump', clumpAttribute);
  geometry.instanceCount = 0;
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1000);

  return { clumpAttribute, dataAttribute, geometry, maxCount, offsetAttribute };
}

// Fills a chunk's store from a world-space jittered grid. Blades are
// rejected where the path is worn through or the ground dips underwater,
// and shrink toward path edges so trails feather out instead of ending in
// a hard stripe.
export function scatterChunkBlades(store, { count, cx, cz, clumpSize, world }) {
  const { clumpAttribute, dataAttribute, geometry, maxCount, offsetAttribute } =
    store;
  const offsets = offsetAttribute.array;
  const data = dataAttribute.array;
  const clump = clumpAttribute.array;
  const placedMax = Math.min(count, maxCount);
  const { seed, waterLevel } = world;

  const centerX = cx * CHUNK_SIZE;
  const centerZ = cz * CHUNK_SIZE;
  const minX = centerX - CHUNK_SIZE / 2;
  const maxX = centerX + CHUNK_SIZE / 2;
  const minZ = centerZ - CHUNK_SIZE / 2;
  const maxZ = centerZ + CHUNK_SIZE / 2;

  const cellSize = Math.max(CHUNK_SIZE / Math.sqrt(placedMax), 0.05);
  const minCellX = Math.floor(minX / cellSize) - 1;
  const maxCellX = Math.ceil(maxX / cellSize) + 1;
  const minCellZ = Math.floor(minZ / cellSize) - 1;
  const maxCellZ = Math.ceil(maxZ / cellSize) + 1;

  const safeClumpSize = Math.max(clumpSize, 1e-3);

  let placed = 0;
  for (let gz = minCellZ; gz <= maxCellZ && placed < placedMax; gz += 1) {
    for (let gx = minCellX; gx <= maxCellX && placed < placedMax; gx += 1) {
      const jitterX = hash01(gx, gz, seed + 101);
      const jitterZ = hash01(gx, gz, seed + 211);
      const worldX = (gx + jitterX) * cellSize;
      const worldZ = (gz + jitterZ) * cellSize;

      if (worldX < minX || worldX > maxX || worldZ < minZ || worldZ > maxZ) {
        continue;
      }

      const path = world.samplePath(worldX, worldZ);
      if (path > 0.55) {
        continue;
      }

      const height = world.sampleHeight(worldX, worldZ);
      if (height < waterLevel + 0.05) {
        continue;
      }

      // Thin and shorten blades approaching a path or a shoreline.
      const pathShrink = 1 - path * 0.8;
      const shoreShrink =
        1 - world.sampleShore(worldX, worldZ) * 0.5 * (1 - path);

      // Clump cells drive shading (shared tint seed + dome normal).
      const cellX = Math.floor(worldX / safeClumpSize);
      const cellZ = Math.floor(worldZ / safeClumpSize);
      const clumpCenterX =
        (cellX + 0.5 + (hash01(cellX, cellZ, seed + 11) - 0.5) * 0.8) *
        safeClumpSize;
      const clumpCenterZ =
        (cellZ + 0.5 + (hash01(cellX, cellZ, seed + 23) - 0.5) * 0.8) *
        safeClumpSize;
      const dx = clumpCenterX - worldX;
      const dz = clumpCenterZ - worldZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const closeness = Math.max(0, 1 - dist / safeClumpSize);
      const invDist = dist > 1e-5 ? 1 / dist : 0;

      offsets[placed * 3] = worldX - centerX;
      offsets[placed * 3 + 1] = height - 0.02;
      offsets[placed * 3 + 2] = worldZ - centerZ;
      data[placed * 4] = hash01(gx, gz, seed + 307) * Math.PI * 2;
      data[placed * 4 + 1] =
        (0.7 + hash01(gx, gz, seed + 401) * 0.6) * pathShrink * shoreShrink;
      data[placed * 4 + 2] = hash01(gx, gz, seed + 503);
      data[placed * 4 + 3] = hash01(gx, gz, seed + 601);
      clump[placed * 4] = dx * invDist * closeness;
      clump[placed * 4 + 1] = dz * invDist * closeness;
      clump[placed * 4 + 2] = hash01(cellX, cellZ, seed + 701);
      clump[placed * 4 + 3] = hash01(gx, gz, seed + 809);

      placed += 1;
    }
  }

  offsetAttribute.needsUpdate = true;
  dataAttribute.needsUpdate = true;
  clumpAttribute.needsUpdate = true;
  geometry.instanceCount = placed;

  return placed;
}
