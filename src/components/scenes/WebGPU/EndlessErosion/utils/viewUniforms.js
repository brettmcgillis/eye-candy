/* eslint-disable no-param-reassign */
import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

export default function createViewUniforms() {
  return {
    camForward: uniform(new THREE.Vector3(0, 0, -1)),
    camPos: uniform(new THREE.Vector3()),
    camRight: uniform(new THREE.Vector3(1, 0, 0)),
    camUp: uniform(new THREE.Vector3(0, 1, 0)),
    debugView: uniform(0, 'int'),
    resolution: uniform(new THREE.Vector2(1, 1)),
    tanHalfFov: uniform(Math.tan(THREE.MathUtils.degToRad(11) / 2)),
  };
}

// Three things here are what make the marched view land on the same shot the
// mesh view does. The matrix has to be refreshed, because a frame callback runs
// before the renderer updates it and the orbit controls have already moved the
// camera by then. The origin has to be the world position, because the rig may
// parent the camera under a pivot, which leaves `position` a local offset. And
// zoom divides the projection in three's own perspective matrix, so the ray's
// half-angle has to be divided by it too.
export function syncCamera(view, camera, size) {
  camera.updateMatrixWorld();
  camera.getWorldPosition(view.camPos.value);

  camera.matrixWorld.extractBasis(
    view.camRight.value,
    view.camUp.value,
    view.camForward.value
  );
  view.camRight.value.normalize();
  view.camUp.value.normalize();
  view.camForward.value.normalize().negate();

  const zoom = camera.zoom || 1;
  view.tanHalfFov.value =
    Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) / zoom;

  view.resolution.value.set(size.width, size.height);
}
