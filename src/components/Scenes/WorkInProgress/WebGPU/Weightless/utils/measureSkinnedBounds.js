import * as THREE from 'three/webgpu';

const bone = new THREE.Matrix4();
const skinned = new THREE.Vector3();
const acc = new THREE.Vector3();
const bounds = new THREE.Box3();

// CPU-skins a subset of the sampled particles against the skeleton's
// current boneMatrices to find the bird's real bounds. In three's default
// 'attached' bind mode the bone matrices produce world-space positions
// directly (basePos already has bindMatrix baked in), so this measures
// exactly where the GPU kernel will place the particles. `preMatrix`
// converts into the space the fit is applied in (inverse of the user
// scale/yaw group).
export default function measureSkinnedBounds(
  samples,
  skeleton,
  preMatrix,
  maxSamples = 512
) {
  const { boneMatrices } = skeleton;
  const step = Math.max(1, Math.floor(samples.count / maxSamples));
  bounds.makeEmpty();

  for (let i = 0; i < samples.count; i += step) {
    acc.set(0, 0, 0);
    for (let k = 0; k < 4; k += 1) {
      const w = samples.skinWeight[i * 4 + k];
      if (w > 0) {
        const j = samples.skinIndex[i * 4 + k];
        bone.fromArray(boneMatrices, j * 16);
        skinned
          .fromArray(samples.basePos, i * 3)
          .applyMatrix4(bone)
          .multiplyScalar(w);
        acc.add(skinned);
      }
    }
    acc.applyMatrix4(preMatrix);
    bounds.expandByPoint(acc);
  }

  const center = bounds.getCenter(new THREE.Vector3());
  const radius = bounds.getSize(new THREE.Vector3()).length() * 0.5;
  return { center, radius };
}
