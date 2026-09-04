import * as THREE from 'three/webgpu';

const scratchRay = new THREE.Raycaster();
const scratchPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const scratchPoint = new THREE.Vector3();

// The bed is one unit box displaced entirely on the GPU, so raycasting its
// geometry hits nothing useful — pick against the sand plane instead. Without
// this, PostRig never even attaches its pointerdown listener and DOF's
// `pointer` focus mode silently does nothing.
export default function createFocusPicker({ groundY }) {
  return (ndc, camera) => {
    scratchRay.setFromCamera(ndc, camera);
    scratchPlane.constant = -groundY;

    return scratchRay.ray.intersectPlane(scratchPlane, scratchPoint);
  };
}
