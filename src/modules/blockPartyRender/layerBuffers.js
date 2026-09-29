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
    tone: new THREE.InstancedBufferAttribute(new Float32Array(capacity), 1),
  };
}

export function attachLayerBuffers(geometry, buffers) {
  geometry.setAttribute('aInfo', buffers.info);
  geometry.setAttribute('aReveal', buffers.reveal);
  geometry.setAttribute('aSeed', buffers.seed);
  geometry.setAttribute('aTone', buffers.tone);
}

// three picks a uniform buffer for instance matrices from the live count but
// binds the whole capacity, which overflows the 64KB uniform limit once a
// layer holds more than 1024 slots. A storage attribute is never a uniform.
export function createInstanceMatrix(capacity) {
  return new THREE.StorageInstancedBufferAttribute(
    new Float32Array(capacity * 16),
    16
  );
}

// A box is [centre x, anchor y, centre z, width, height, depth]: translation
// and scale only, written straight into the column-major matrix.
function writeBox(array, offset, [x, y, z, w, h, d]) {
  array.fill(0, offset, offset + 16);
  array[offset] = w;
  array[offset + 5] = h;
  array[offset + 10] = d;
  array[offset + 12] = x;
  array[offset + 13] = y;
  array[offset + 14] = z;
  array[offset + 15] = 1;
}

// The material's nodes hold these attributes by reference, so arrays are
// written in place rather than swapped.
export function writeLayer(mesh, buffers, instances) {
  const count = Math.min(instances.length, buffers.reveal.count);
  const matrices = mesh.instanceMatrix.array;

  for (let index = 0; index < count; index += 1) {
    const item = instances[index];

    writeBox(matrices, index * 16, item.box);
    buffers.reveal.array.set(item.life, index * 2);
    buffers.seed.array[index] = item.seed;
    buffers.tone.array[index] = item.tone;
    buffers.info.array.set(item.info, index * 4);
  }

  mesh.count = count;
  mesh.visible = count > 0;
  mesh.instanceMatrix.needsUpdate = true;
  Object.values(buffers).forEach((buffer) => {
    buffer.needsUpdate = true;
  });
}
