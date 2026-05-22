import * as THREE from 'three';

import { buildPlumeGeometry } from '../perlinNoiseBall/perlinNoiseSplineShared';

export const DEFAULT_GPU_FIRE_CONTROL_POINT_COUNT = 5;

function toVector3(value) {
  if (value?.isVector3) {
    return value.clone();
  }

  if (Array.isArray(value)) {
    return new THREE.Vector3(value[0] ?? 0, value[1] ?? 0, value[2] ?? 0);
  }

  return new THREE.Vector3(value?.x ?? 0, value?.y ?? 0, value?.z ?? 0);
}

function readScaleAxis(scale, axis, fallback) {
  if (scale?.isVector3) {
    return Number.isFinite(scale[axis]) ? scale[axis] : fallback;
  }

  if (Array.isArray(scale)) {
    const index = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    return Number.isFinite(scale[index]) ? scale[index] : fallback;
  }

  return Number.isFinite(scale?.[axis]) ? scale[axis] : fallback;
}

export function resolveVolumetricFireControlPoints({
  controlPoints = null,
  width = 0.35,
  height = 1,
  depth = 0.35,
  bendX = 0,
  bendZ = 0,
  count = DEFAULT_GPU_FIRE_CONTROL_POINT_COUNT,
}) {
  if (controlPoints?.length >= 2) {
    return controlPoints.map((point) => {
      const position = toVector3(point.position ?? point.pos);
      const scaleX = readScaleAxis(point.scale, 'x', width);
      const scaleZ = readScaleAxis(point.scale, 'z', depth);

      return {
        position,
        radius: Math.max(0.05, Math.max(scaleX, scaleZ) * 0.5),
      };
    });
  }

  const halfHeight = height / 2;

  return Array.from({ length: count }, (_, index) => {
    const t = index / (count - 1);
    const lean = t * t;
    const scaledWidth = width * (1 - t * 0.25);
    const scaledDepth = depth * (1 - t * 0.25);

    return {
      position: new THREE.Vector3(
        bendX * lean,
        -halfHeight + t * height,
        bendZ * lean
      ),
      radius: Math.max(0.05, Math.max(scaledWidth, scaledDepth) * 0.5),
    };
  });
}

export function buildVolumetricFireCurve(plumeControlPoints) {
  const sourcePoints =
    plumeControlPoints.length > 1
      ? plumeControlPoints.map(({ position }) => position.clone())
      : [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0)];

  return new THREE.CatmullRomCurve3(sourcePoints, false, 'centripetal');
}

export function buildVolumetricFireGeometry(
  curve,
  plumeControlPoints,
  { tubularSegments = 72, radialSegments = 24, capSegments = 10 } = {}
) {
  return buildPlumeGeometry(
    curve,
    plumeControlPoints,
    tubularSegments,
    radialSegments,
    capSegments
  );
}

export function buildVolumetricFireGuideGeometry(curve, sampleCount = 41) {
  const points = curve.getPoints(sampleCount - 1);
  const positions = new Float32Array(points.length * 3);

  points.forEach((point, index) => {
    const offset = index * 3;
    positions[offset] = point.x;
    positions[offset + 1] = point.y;
    positions[offset + 2] = point.z;
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  return geometry;
}
