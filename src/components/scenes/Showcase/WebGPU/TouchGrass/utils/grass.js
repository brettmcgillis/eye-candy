import * as THREE from 'three/webgpu';

import { hash01, mulberry32 } from '../../../../../../utils/noise2d';

// Instanced grass buffers are allocated once at MAX_COUNT and refilled in
// place on rescatter, so both the geometry and the material (which binds the
// instanced attributes) stay stable across control changes.
//
// Blade geometry (after revo-realms): rows of left/right vertex pairs plus a
// single pointed tip vertex. Width taper and bend happen in the shader.

export const MAX_BLADES = 150000;
export const BLADE_SEGMENTS = 4;
const GRASS_EDGE_OVERDRAW = 0.5;

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

export function createGrassStore(maxCount = MAX_BLADES) {
  const blade = createBladeGeometry();
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setIndex(new THREE.BufferAttribute(blade.indices, 1));
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(blade.positions, 3)
  );
  geometry.setAttribute('normal', new THREE.BufferAttribute(blade.normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(blade.uvs, 2));

  // offset: xyz root position.
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

  return { clumpAttribute, dataAttribute, geometry, offsetAttribute };
}

// Rejection-samples the meadow: skips carved letters, pulls blades toward
// jittered clump centers (Ghost-of-Tsushima-style clumping — clumps drive
// color layering and normal doming in the material), and shrinks blades near
// cut edges so the grass thins out at the rim.
export function scatterBlades(
  store,
  { clumpPull, clumpSize, count, heightField, seed }
) {
  const { clumpAttribute, dataAttribute, geometry, offsetAttribute } = store;
  const offsets = offsetAttribute.array;
  const data = dataAttribute.array;
  const clump = clumpAttribute.array;
  const rng = mulberry32(seed * 7919 + count);
  // Slightly overdraw beyond chunk bounds so adjacent chunks overlap grass
  // coverage at seams instead of leaving a bare strip.
  const half = heightField.worldSize * GRASS_EDGE_OVERDRAW;
  const target = Math.min(count, MAX_BLADES);
  const maxAttempts = target * 30;

  let placed = 0;
  for (
    let attempt = 0;
    attempt < maxAttempts && placed < target;
    attempt += 1
  ) {
    let x = (rng() * 2 - 1) * half;
    let z = (rng() * 2 - 1) * half;

    // Clumps are primarily a SHADING concept (shared tint seed + dome
    // normal), not a positional one — heavy pulls read as a grid of blobs
    // and hollow out cell borders. Keep the scatter uniform; clumpPull only
    // nudges blades subtly (capped) so coverage stays even and lush.
    const cellX = Math.floor(x / clumpSize);
    const cellZ = Math.floor(z / clumpSize);
    const clumpSeed = hash01(cellX, cellZ, seed);
    const centerX =
      (cellX + 0.5 + (hash01(cellX, cellZ, seed + 11) - 0.5) * 0.8) * clumpSize;
    const centerZ =
      (cellZ + 0.5 + (hash01(cellX, cellZ, seed + 23) - 0.5) * 0.8) * clumpSize;
    const pull = Math.min(clumpPull, 0.25);
    x += (centerX - x) * pull;
    z += (centerZ - z) * pull;

    const carve = heightField.sampleCarve(x, z);
    if (carve < 0.3) {
      const edgeShrink = 1 - (carve / 0.3) * 0.5;
      const dx = centerX - x;
      const dz = centerZ - z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const closeness = Math.max(0, 1 - dist / clumpSize);
      const invDist = dist > 1e-5 ? 1 / dist : 0;

      offsets[placed * 3] = x;
      offsets[placed * 3 + 1] = heightField.sampleHeight(x, z) - 0.02;
      offsets[placed * 3 + 2] = z;
      data[placed * 4] = rng() * Math.PI * 2;
      data[placed * 4 + 1] = (0.7 + rng() * 0.6) * edgeShrink;
      data[placed * 4 + 2] = rng();
      data[placed * 4 + 3] = rng();
      clump[placed * 4] = dx * invDist * closeness;
      clump[placed * 4 + 1] = dz * invDist * closeness;
      clump[placed * 4 + 2] = clumpSeed;
      clump[placed * 4 + 3] = rng();
      placed += 1;
    }
  }

  offsetAttribute.needsUpdate = true;
  dataAttribute.needsUpdate = true;
  clumpAttribute.needsUpdate = true;
  geometry.instanceCount = placed;

  return placed;
}
