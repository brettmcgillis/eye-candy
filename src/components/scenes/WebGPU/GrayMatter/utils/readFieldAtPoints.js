import {
  Fn,
  instanceIndex,
  instancedArray,
  storage,
  texture3D,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

// Samples V of the Gray-Scott field at every given point on the GPU and
// hands it back to the CPU.
export default function createFieldReader({ field, positions, volume }) {
  const count = positions.length / 3;
  const { dims, origin, voxelSize } = volume;
  const extent = vec3(...dims.map((n) => n * voxelSize));
  const points = storage(
    new THREE.StorageBufferAttribute(positions, 3),
    'vec3',
    count
  ).toReadOnly();
  const out = instancedArray(count, 'float');
  const fieldNode = texture3D(field, null, 0);

  const pass = Fn(() => {
    const t = fieldNode.sample(
      points
        .element(instanceIndex)
        .sub(vec3(...origin))
        .div(extent)
    );
    out.element(instanceIndex).assign(t.y.mul(t.z));
  })().compute(count);

  return async (renderer) => {
    renderer.compute(pass);
    return new Float32Array(await renderer.getArrayBufferAsync(out.value));
  };
}
