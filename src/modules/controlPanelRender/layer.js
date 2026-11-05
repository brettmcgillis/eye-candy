/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

const MIN_CAPACITY = 256;
const ATTRIBUTES = ['aP', 'aQ', 'aS', 'aC', 'aE'];
const NO_GLOW = [0, 0, 0];

// One mesh drawing `count` parts of a unit primitive from per-instance vec4
// attributes. Materials hold attributes by reference, so outgrowing the
// capacity rebuilds geometry, material and mesh together.
export default function createLayer({
  buildMaterial,
  group,
  shadows = true,
  template,
}) {
  let capacity = 0;
  let geometry = null;
  let material = null;
  let mesh = null;
  let castShadow = shadows;

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
    ATTRIBUTES.forEach((name) => {
      const attribute = new THREE.InstancedBufferAttribute(
        new Float32Array(capacity * 4),
        4
      );
      attribute.setUsage(THREE.DynamicDrawUsage);
      geometry.setAttribute(name, attribute);
    });
    material = buildMaterial();
    mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    mesh.count = 0;
    mesh.visible = false;
    group.add(mesh);
  }

  allocate(0);

  return {
    get mesh() {
      return mesh;
    },

    set(parts) {
      allocate(parts.length);
      const [aP, aQ, aS, aC, aE] = ATTRIBUTES.map(
        (name) => geometry.getAttribute(name).array
      );
      for (let i = 0; i < parts.length; i += 1) {
        const { b, c, e, m, p, q, r, s, w } = parts[i];
        const o = i * 4;
        aP.set(p, o);
        aP[o + 3] = m;
        aQ.set(q, o);
        aS.set(s, o);
        aS[o + 3] = r;
        aC.set(c, o);
        aC[o + 3] = w ?? 0;
        aE.set(e ?? NO_GLOW, o);
        aE[o + 3] = b ?? 0;
      }
      ATTRIBUTES.forEach((name) => {
        const attribute = geometry.getAttribute(name);
        attribute.needsUpdate = true;
        attribute.clearUpdateRanges();
        attribute.addUpdateRange(0, Math.max(parts.length, 1) * 4);
      });
      mesh.count = parts.length;
      mesh.visible = parts.length > 0;
    },

    setShadows(cast) {
      castShadow = shadows && cast;
      mesh.castShadow = castShadow;
    },

    dispose() {
      group.remove(mesh);
      geometry.dispose();
      material.dispose();
    },
  };
}
