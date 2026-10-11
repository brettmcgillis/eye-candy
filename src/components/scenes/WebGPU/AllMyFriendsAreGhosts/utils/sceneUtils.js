import * as THREE from 'three';

const DEG2RAD = Math.PI / 180;

// LightingRig's spherical convention: azimuth 0 is +Z, 90 is +X.
export function directionFromAngles(azimuth, elevation) {
  const az = azimuth * DEG2RAD;
  const el = elevation * DEG2RAD;
  const horizontal = Math.cos(el);
  return new THREE.Vector3(
    Math.sin(az) * horizontal,
    Math.sin(el),
    Math.cos(az) * horizontal
  );
}

export function toTuple(vector) {
  return [vector.x, vector.y, vector.z];
}
