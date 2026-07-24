import * as THREE from 'three';

export function toVector3(value) {
  if (value instanceof THREE.Vector3) return value.clone();
  if (Array.isArray(value))
    return new THREE.Vector3(value[0], value[1], value[2]);
  return new THREE.Vector3(value?.x ?? 0, value?.y ?? 0, value?.z ?? 0);
}

export function toTuple(vector) {
  return [vector.x, vector.y, vector.z];
}

export function toVectorArray(obj) {
  return toTuple(toVector3(obj));
}

export function toRotationArray(obj) {
  return [obj?.x ?? 0, obj?.y ?? 0, obj?.z ?? 0].map(THREE.MathUtils.degToRad);
}

export function vectorFromObject(obj) {
  return new THREE.Vector3(obj?.x ?? 0, obj?.y ?? 0, obj?.z ?? 0);
}
