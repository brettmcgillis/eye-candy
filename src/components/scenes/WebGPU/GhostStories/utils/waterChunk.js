import * as THREE from 'three/webgpu';

import { CHUNK_SIZE } from './worldgen';

// Builds one chunk's water geometry: a flat grid at the water table that
// only emits cells where the terrain actually dips below the table — water
// lives in the basins and nowhere else (no film over paths or meadow).
//
// Each vertex carries a `depth` attribute (how far the terrain below it
// sits under the table). The material scales ALL displacement (sim ripples
// + ambient wavelets) by depth, so the surface stays pinned at the
// shoreline instead of waving up onto the banks.
//
// Returns null when the chunk holds no water at all.
export default function buildWaterChunk(world, cx, cz, segments) {
  const originX = cx * CHUNK_SIZE - CHUNK_SIZE / 2;
  const originZ = cz * CHUNK_SIZE - CHUNK_SIZE / 2;
  const centerX = cx * CHUNK_SIZE;
  const centerZ = cz * CHUNK_SIZE;
  const step = CHUNK_SIZE / segments;
  const side = segments + 1;
  const { waterLevel } = world;

  // Sample terrain depth below the table at every grid corner.
  const depths = new Float32Array(side * side);
  let wetCorners = 0;
  for (let j = 0; j < side; j += 1) {
    const worldZ = originZ + j * step;
    for (let i = 0; i < side; i += 1) {
      const worldX = originX + i * step;
      const depth = waterLevel - world.sampleHeight(worldX, worldZ);
      depths[j * side + i] = depth;
      if (depth > 0) wetCorners += 1;
    }
  }
  if (wetCorners === 0) return null;

  // Emit only cells with at least one submerged corner (the shoreline cell
  // rim included, so the plane tucks under the bank).
  const vertexIndexMap = new Int32Array(side * side).fill(-1);
  const positions = [];
  const depthAttr = [];
  const indices = [];

  const getVertex = (i, j) => {
    const key = j * side + i;
    if (vertexIndexMap[key] === -1) {
      vertexIndexMap[key] = positions.length / 3;
      positions.push(
        originX + i * step - centerX,
        0,
        originZ + j * step - centerZ
      );
      depthAttr.push(Math.max(depths[key], 0));
    }
    return vertexIndexMap[key];
  };

  for (let j = 0; j < segments; j += 1) {
    for (let i = 0; i < segments; i += 1) {
      const cellDepths = [
        depths[j * side + i],
        depths[j * side + i + 1],
        depths[(j + 1) * side + i],
        depths[(j + 1) * side + i + 1],
      ];
      if (Math.max(...cellDepths) <= 0) continue; // eslint-disable-line no-continue

      const a = getVertex(i, j);
      const b = getVertex(i + 1, j);
      const c = getVertex(i, j + 1);
      const d = getVertex(i + 1, j + 1);
      indices.push(a, c, b, b, c, d);
    }
  }
  if (indices.length === 0) return null;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(positions), 3)
  );
  geometry.setAttribute(
    'depth',
    new THREE.BufferAttribute(new Float32Array(depthAttr), 1)
  );
  geometry.setIndex(
    positions.length / 3 > 65535
      ? new THREE.BufferAttribute(new Uint32Array(indices), 1)
      : new THREE.BufferAttribute(new Uint16Array(indices), 1)
  );
  geometry.computeBoundingSphere();
  return geometry;
}
