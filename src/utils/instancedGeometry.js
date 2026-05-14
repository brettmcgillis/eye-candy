import * as THREE from 'three';

function toScaleVector(scale = 1) {
  if (Array.isArray(scale)) {
    return new THREE.Vector3(scale[0], scale[1], scale[2]);
  }

  return new THREE.Vector3(scale, scale, scale);
}

function buildTransformMatrix(transform = {}) {
  const position = new THREE.Vector3(...(transform.position ?? [0, 0, 0]));
  const rotation = new THREE.Euler(...(transform.rotation ?? [0, 0, 0]));
  const quaternion = new THREE.Quaternion().setFromEuler(rotation);
  const scale = toScaleVector(transform.scale ?? 1);

  return new THREE.Matrix4().compose(position, quaternion, scale);
}

export default function bakeInstancedGeometry(geometry, transformChain = []) {
  const bakedGeometry = geometry.clone();
  const transformMatrix = new THREE.Matrix4();

  transformChain.forEach((transform) => {
    transformMatrix.multiply(buildTransformMatrix(transform));
  });

  bakedGeometry.applyMatrix4(transformMatrix);
  bakedGeometry.computeBoundingBox();
  bakedGeometry.computeBoundingSphere();

  return bakedGeometry;
}
