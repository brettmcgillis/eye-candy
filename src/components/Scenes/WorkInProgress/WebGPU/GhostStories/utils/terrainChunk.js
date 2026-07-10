import * as THREE from 'three/webgpu';

import { CHUNK_SIZE } from './worldgen';

// Builds one terrain chunk: a CPU-displaced grid whose positions are local
// to the chunk center (the mesh/RigidBody is placed at the center, so far
// chunks keep float precision). Normals come from central differences of
// the world sampler, which keeps lighting seamless across chunk borders —
// computeVertexNormals would shade edge vertices differently per chunk.
//
// The `mask` attribute carries (path, shore) factors so the terrain
// material can tint worn paths and pond shores without re-baking geometry
// when colors change.
export default function buildTerrainChunk(world, cx, cz, segments) {
  const originX = cx * CHUNK_SIZE - CHUNK_SIZE / 2;
  const originZ = cz * CHUNK_SIZE - CHUNK_SIZE / 2;
  const centerX = cx * CHUNK_SIZE;
  const centerZ = cz * CHUNK_SIZE;
  const step = CHUNK_SIZE / segments;
  const side = segments + 1;

  const positions = new Float32Array(side * side * 3);
  const normals = new Float32Array(side * side * 3);
  const masks = new Float32Array(side * side * 2);
  const indices = new Uint32Array(segments * segments * 6);

  const eps = step * 0.5;
  let vertex = 0;
  for (let j = 0; j < side; j += 1) {
    const worldZ = originZ + j * step;
    for (let i = 0; i < side; i += 1) {
      const worldX = originX + i * step;
      const height = world.sampleHeight(worldX, worldZ);

      positions[vertex * 3] = worldX - centerX;
      positions[vertex * 3 + 1] = height;
      positions[vertex * 3 + 2] = worldZ - centerZ;

      const dx =
        world.sampleHeight(worldX + eps, worldZ) -
        world.sampleHeight(worldX - eps, worldZ);
      const dz =
        world.sampleHeight(worldX, worldZ + eps) -
        world.sampleHeight(worldX, worldZ - eps);
      const inverseLength = 1 / Math.hypot(dx, 2 * eps, dz);
      normals[vertex * 3] = -dx * inverseLength;
      normals[vertex * 3 + 1] = 2 * eps * inverseLength;
      normals[vertex * 3 + 2] = -dz * inverseLength;

      masks[vertex * 2] = world.samplePath(worldX, worldZ);
      masks[vertex * 2 + 1] = world.sampleShore(worldX, worldZ);

      vertex += 1;
    }
  }

  let write = 0;
  for (let j = 0; j < segments; j += 1) {
    for (let i = 0; i < segments; i += 1) {
      const a = j * side + i;
      const b = a + 1;
      const c = a + side;
      const d = c + 1;
      indices[write] = a;
      indices[write + 1] = c;
      indices[write + 2] = b;
      indices[write + 3] = b;
      indices[write + 4] = c;
      indices[write + 5] = d;
      write += 6;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('mask', new THREE.BufferAttribute(masks, 2));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeBoundingSphere();

  // Trimesh collider shares the exact render vertices, so the ghost walks
  // precisely on what it sees.
  return { colliderIndices: indices, colliderVertices: positions, geometry };
}
