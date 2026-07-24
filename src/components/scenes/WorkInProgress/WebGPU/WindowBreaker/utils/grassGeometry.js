/* eslint-disable no-continue */
import * as THREE from 'three/webgpu';

import { grassCoverageAt, groundHeightAt } from './heightField';
import { GRASS_AREA } from './sceneLayout';

const BLADE_SEGMENTS = 4;

function hash01(x, y, seed) {
  const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return s - Math.floor(s);
}

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

// One instanced field scattered on a world-space jittered grid, blades snapped
// to the shared terrain height field and thinned/culled by the grass coverage
// mask. offset = xyz world root; data = (yaw, scale, seed, phase).
export default function createGrassField(maxCount, heightCfg, grassCfg) {
  const blade = createBladeGeometry();
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setIndex(new THREE.BufferAttribute(blade.indices, 1));
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(blade.positions, 3)
  );
  geometry.setAttribute('normal', new THREE.BufferAttribute(blade.normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(blade.uvs, 2));

  const offsets = new Float32Array(maxCount * 3);
  const data = new Float32Array(maxCount * 4);

  const half = GRASS_AREA / 2;
  const cellSize = Math.max(GRASS_AREA / Math.sqrt(maxCount), 0.03);
  const cells = Math.ceil(GRASS_AREA / cellSize);

  let placed = 0;
  for (let gz = 0; gz < cells && placed < maxCount; gz += 1) {
    for (let gx = 0; gx < cells && placed < maxCount; gx += 1) {
      const jitterX = hash01(gx, gz, 11.3);
      const jitterZ = hash01(gx, gz, 27.1);
      const x = -half + (gx + jitterX) * cellSize;
      const z = -half + (gz + jitterZ) * cellSize;

      const coverage = grassCoverageAt(x, z, grassCfg);
      if (coverage <= 0.02) {
        continue;
      }
      if (hash01(gx, gz, 51.7) > coverage) {
        continue;
      }

      const y = groundHeightAt(x, z, heightCfg);
      offsets[placed * 3] = x;
      offsets[placed * 3 + 1] = y;
      offsets[placed * 3 + 2] = z;
      data[placed * 4] = hash01(gx, gz, 73.9) * Math.PI * 2;
      data[placed * 4 + 1] = 0.6 + hash01(gx, gz, 91.2) * 0.7;
      data[placed * 4 + 2] = hash01(gx, gz, 133.7);
      data[placed * 4 + 3] = hash01(gx, gz, 167.3);
      placed += 1;
    }
  }

  const offsetAttribute = new THREE.InstancedBufferAttribute(offsets, 3);
  const dataAttribute = new THREE.InstancedBufferAttribute(data, 4);
  geometry.setAttribute('instanceOffset', offsetAttribute);
  geometry.setAttribute('instanceData', dataAttribute);
  geometry.instanceCount = placed;
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), GRASS_AREA);

  return { geometry, placed };
}
