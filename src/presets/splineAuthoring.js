import * as THREE from 'three';

const DEFAULT_ROTATION = [0, 0, 0];
const DEFAULT_SCALE = [1, 1, 1];

export function makeSplinePoint(
  position,
  rotation = DEFAULT_ROTATION,
  scale = DEFAULT_SCALE
) {
  return {
    position: new THREE.Vector3(...position),
    rotation: new THREE.Euler(...rotation),
    scale: new THREE.Vector3(...scale),
  };
}

export function makeSpline({
  points = [],
  pos = [0, 0, 0],
  rot = DEFAULT_ROTATION,
  scale = DEFAULT_SCALE,
  ...config
}) {
  return {
    ...config,
    pos: [...pos],
    rot: [...rot],
    scale: [...scale],
    points: points.map((point) =>
      Array.isArray(point)
        ? makeSplinePoint(point)
        : makeSplinePoint(point.position, point.rotation, point.scale)
    ),
  };
}
