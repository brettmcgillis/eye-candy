import * as THREE from 'three/webgpu';

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

function instancedAttribute(maxCount, itemSize) {
  const attribute = new THREE.InstancedBufferAttribute(
    new Float32Array(maxCount * itemSize),
    itemSize
  );
  attribute.setUsage(THREE.DynamicDrawUsage);
  return attribute;
}

// offset xyz root | data yaw, scale, seed, phase | clump dir.xy, seed, bend
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

  const offsetAttribute = instancedAttribute(maxCount, 3);
  const dataAttribute = instancedAttribute(maxCount, 4);
  const clumpAttribute = instancedAttribute(maxCount, 4);
  geometry.setAttribute('instanceOffset', offsetAttribute);
  geometry.setAttribute('instanceData', dataAttribute);
  geometry.setAttribute('instanceClump', clumpAttribute);
  geometry.instanceCount = 0;
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1000);

  return { clumpAttribute, dataAttribute, geometry, maxCount, offsetAttribute };
}

export function commitGrassStore(store, placed) {
  const { clumpAttribute, dataAttribute, geometry, offsetAttribute } = store;
  offsetAttribute.needsUpdate = true;
  dataAttribute.needsUpdate = true;
  clumpAttribute.needsUpdate = true;
  geometry.instanceCount = placed;
  return placed;
}
