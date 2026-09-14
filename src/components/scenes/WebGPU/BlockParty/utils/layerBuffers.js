/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

export function createLayerBuffers(capacity) {
  return {
    info: new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4),
    reveal: new THREE.InstancedBufferAttribute(
      new Float32Array(capacity * 2),
      2
    ),
    seed: new THREE.InstancedBufferAttribute(new Float32Array(capacity), 1),
  };
}

export function attachLayerBuffers(geometry, buffers) {
  geometry.setAttribute('aInfo', buffers.info);
  geometry.setAttribute('aReveal', buffers.reveal);
  geometry.setAttribute('aSeed', buffers.seed);
}

// The material's nodes hold these attributes by reference, so arrays are
// written in place rather than swapped.
// three picks a uniform buffer for instance matrices from the live count but
// binds the whole capacity, which overflows the 64KB uniform limit once a
// layer holds more than 1024 slots. A storage attribute is never a uniform.
function ensureStorageMatrix(mesh) {
  if (mesh.instanceMatrix.isStorageInstancedBufferAttribute) {
    return;
  }

  mesh.instanceMatrix = new THREE.StorageInstancedBufferAttribute(
    mesh.instanceMatrix.array,
    16
  );
}

export function writeLayer(mesh, buffers, instances) {
  ensureStorageMatrix(mesh);

  const count = Math.min(instances.length, buffers.reveal.count);

  for (let index = 0; index < count; index += 1) {
    const item = instances[index];

    mesh.setMatrixAt(index, item.matrix);
    buffers.reveal.array.set(item.life, index * 2);
    buffers.seed.array[index] = item.seed;
    buffers.info.array.set(item.info, index * 4);
  }

  mesh.count = count;
  mesh.instanceMatrix.needsUpdate = true;
  [buffers.info, buffers.reveal, buffers.seed].forEach((buffer) => {
    if (buffer) {
      buffer.needsUpdate = true;
    }
  });
}
