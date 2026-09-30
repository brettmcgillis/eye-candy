/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

const MIN_CAPACITY = 1024;

// One mesh drawing `count` instances of `geometry` from per-instance vec4
// attributes. Materials hold attributes by reference, so outgrowing the
// capacity rebuilds the geometry, the material and the mesh together.
export default function createLayer({
  attributes,
  buildMaterial,
  castShadow: casts = true,
  geometry: template,
  group,
  receiveShadow = true,
}) {
  let capacity = 0;
  let geometry = null;
  let material = null;
  let mesh = null;
  let castShadow = casts;

  function allocate(needed) {
    let next = Math.max(capacity, MIN_CAPACITY);
    while (next < needed) next *= 2;
    if (mesh && next === capacity) return;

    if (mesh) {
      group.remove(mesh);
      geometry.dispose();
      material.dispose();
    }
    capacity = next;
    geometry = template.clone();
    attributes.forEach((name) => {
      geometry.setAttribute(
        name,
        new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4)
      );
    });
    material = buildMaterial();
    mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    mesh.count = 0;
    mesh.visible = false;
    group.add(mesh);
  }

  allocate(0);

  return {
    get material() {
      return material;
    },
    get mesh() {
      return mesh;
    },

    // `write(item, arrays, offset)` fills one instance's vec4s.
    set(items, write) {
      allocate(items.length);
      const arrays = Object.fromEntries(
        attributes.map((name) => [name, geometry.getAttribute(name).array])
      );
      items.forEach((item, index) => write(item, arrays, index * 4));
      attributes.forEach((name) => {
        const attribute = geometry.getAttribute(name);
        attribute.needsUpdate = true;
        attribute.clearUpdateRanges();
        attribute.addUpdateRange(0, Math.max(items.length, 1) * 4);
      });
      mesh.count = items.length;
      mesh.visible = items.length > 0;
    },

    setShadows(cast) {
      castShadow = cast;
      mesh.castShadow = cast;
    },

    dispose() {
      group.remove(mesh);
      geometry.dispose();
      material.dispose();
      template.dispose();
    },
  };
}
