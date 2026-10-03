/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

const MIN_CAPACITY = 1024;

// One mesh drawing `count` instances of `geometry` from a single interleaved
// per-instance buffer (one vertex buffer however many vec4s it holds).
// Outgrowing the capacity rebuilds the geometry and the mesh; a `material`
// passed in is shared and left alone, `buildMaterial` makes one per layer.
export default function createLayer({
  attributes,
  buildMaterial = null,
  geometry: template,
  group,
  material: shared = null,
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
    material = material ?? shared ?? buildMaterial();
    mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.count = 0;
    mesh.visible = false;
    group.add(mesh);
  }

  allocate(0);

  return {
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

    clear() {
      mesh.count = 0;
      mesh.visible = false;
    },

    dispose() {
      group.remove(mesh);
      geometry.dispose();
      if (!shared) material.dispose();
    },
  };
}
