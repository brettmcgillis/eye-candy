import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three/webgpu';

// An offline copy of the live rabbit, in the same world frame, that can be
// posed at any clip time without touching the playing mixer. Arrow wounds and
// graze sites are both read off it once, when the model arrives.
export default function createPoseProbe({ animations, scene }) {
  scene.parent.updateWorldMatrix(true, false);
  const root = new THREE.Group();
  root.matrixAutoUpdate = false;
  root.matrix.copy(scene.parent.matrixWorld);

  const copy = clone(scene);
  root.add(copy);

  let liveMesh = null;
  scene.traverse((object) => {
    if (!liveMesh && object.isSkinnedMesh) liveMesh = object;
  });
  const mesh = copy.getObjectByName(liveMesh.name);

  const [clip] = animations;
  const mixer = new THREE.AnimationMixer(copy);
  mixer.clipAction(clip).play();

  return {
    clip,
    liveMesh,
    mesh,
    bone: (name) => copy.getObjectByName(name),
    pose(time) {
      mixer.setTime(time);
      root.updateMatrixWorld(true);
      mesh.boundingSphere = null;
    },
    dispose() {
      mixer.stopAllAction();
      mixer.uncacheRoot(copy);
    },
  };
}
