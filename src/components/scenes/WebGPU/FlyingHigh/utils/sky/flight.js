import * as THREE from 'three/webgpu';

const DEG = Math.PI / 180;
const Y = new THREE.Vector3(0, 1, 0);
const NOSE = new THREE.Vector3(0, 0, 1);

// Degrees right of straight ahead and up from the horizon, in sky space.
export const skyDirection = (az, el) =>
  new THREE.Vector3(
    Math.sin(az * DEG) * Math.cos(el * DEG),
    Math.sin(el * DEG),
    -Math.cos(az * DEG) * Math.cos(el * DEG)
  );

// The turn from world to sky space: the plane's heading becomes the
// flight's -z, so the cloud sea streams past the way the plane flies.
export function flightYaw(rx, ry, rz) {
  const heading = NOSE.clone().applyEuler(
    new THREE.Euler(rx * DEG, ry * DEG, rz * DEG)
  );
  return new THREE.Quaternion().setFromAxisAngle(
    Y,
    Math.PI - Math.atan2(heading.x, heading.z)
  );
}
