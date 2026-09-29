/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

const from = new THREE.Vector3();
const to = new THREE.Vector3();
const pivot = new THREE.Vector3();
const offset = new THREE.Vector3();
const turn = new THREE.Quaternion();

// A flower is rigid: it turns about its own axis, swings its head direction
// onto the arrangement's target, and slides down its own stem — see
// @modules/flora/bouquet.js. No placement is the identity.
export default function placeFlower(group, placement) {
  group.position.set(0, 0, 0);
  group.quaternion.identity();
  group.scale.setScalar(1);

  if (placement) {
    from.fromArray(placement.from);
    to.fromArray(placement.to);
    pivot.fromArray(placement.pivot);
    turn.setFromAxisAngle(from, placement.turn);

    group.quaternion.setFromUnitVectors(from, to).multiply(turn);
    group.scale.setScalar(placement.scale);
    offset
      .copy(pivot)
      .multiplyScalar(placement.scale)
      .applyQuaternion(group.quaternion);
    group.position
      .copy(pivot)
      .sub(offset)
      .addScaledVector(to, -placement.slide);
  }

  group.updateMatrixWorld(true);
}
