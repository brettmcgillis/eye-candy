/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

const MIN_CAPACITY = 1024;

// One mesh drawing `count` instances of `geometry` from a single interleaved
// per-instance buffer (one vertex buffer however many vec4s it holds).
// Materials hold attributes by reference, so outgrowing the capacity
// rebuilds the geometry, the material and the mesh together.
export default function createLayer({
  attributes,
  buildMaterial,
  geometry: template,
  group,
  renderOrder = 0,
}) {
  const stride = attributes.length * 4;
  let capacity = 0;
  let buffer = null;
  let geometry = null;
  let material = null;
  let mesh = null;

  function allocate(needed) {
    let next = Math.max(capacity, MIN_CAPACITY);
    while (next < needed) next *= 2;
    if (mesh && next === capacity) return;

    const previous = material;
    if (mesh) {
      group.remove(mesh);
      geometry.dispose();
    }
    capacity = next;
    geometry = template.clone();
    buffer = new THREE.InstancedInterleavedBuffer(
      new Float32Array(capacity * stride),
      stride
    );
    buffer.setUsage(THREE.DynamicDrawUsage);
    attributes.forEach((name, slot) => {
      geometry.setAttribute(
        name,
        new THREE.InterleavedBufferAttribute(buffer, 4, slot * 4)
      );
    });
    material = buildMaterial();
    if (previous) {
      material.blending = previous.blending;
      previous.dispose();
    }
    mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.renderOrder = renderOrder;
    mesh.count = 0;
    mesh.visible = false;
    group.add(mesh);
  }

  allocate(0);

  return {
    get material() {
      return material;
    },

    setBlending(blending) {
      material.blending = blending;
      material.needsUpdate = true;
    },

    // `data` holds `count` instances of `stride` floats, packed.
    set(data, count) {
      allocate(count);
      buffer.array.set(data.subarray(0, count * stride));
      buffer.needsUpdate = true;
      buffer.clearUpdateRanges();
      buffer.addUpdateRange(0, Math.max(count, 1) * stride);
      mesh.count = count;
      mesh.visible = count > 0;
    },

    dispose() {
      group.remove(mesh);
      geometry.dispose();
      material.dispose();
      template.dispose();
    },
  };
}
