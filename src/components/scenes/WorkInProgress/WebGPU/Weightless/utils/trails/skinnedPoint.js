import * as THREE from 'three/webgpu';

const bone = new THREE.Matrix4();
const scratch = new THREE.Vector3();

// CPU 4-bone skinning of a bind-space point against the skeleton's current
// boneMatrices — the same transform the GPU paths apply. Used to freeze
// trail vertices in world space at push time (world-smear mode).
export default function skinPoint(point, skin, boneMatrices, target) {
  target.set(0, 0, 0);
  for (let k = 0; k < 4; k += 1) {
    const w = skin.sw[k];
    if (w > 0) {
      bone.fromArray(boneMatrices, skin.si[k] * 16);
      scratch.copy(point).applyMatrix4(bone).multiplyScalar(w);
      target.add(scratch);
    }
  }
  return target;
}
