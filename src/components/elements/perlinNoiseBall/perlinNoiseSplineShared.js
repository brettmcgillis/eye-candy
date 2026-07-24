import * as THREE from 'three';

export const DEFAULT_CONTROL_POINTS = [
  { position: [0, 0, 0], radius: 0.7 },
  { position: [0, 0.9, 0], radius: 0.65 },
  { position: [0.05, 1.8, 0], radius: 0.72 },
  { position: [0.1, 2.7, 0.05], radius: 0.95 },
  { position: [0.15, 3.5, 0.1], radius: 1.25 },
  { position: [0.2, 4.2, 0.15], radius: 1.6 },
];

const TWO_PI = Math.PI * 2;

export function toVec3(point) {
  if (Array.isArray(point))
    return new THREE.Vector3(point[0], point[1], point[2]);
  return new THREE.Vector3(point.x ?? 0, point.y ?? 0, point.z ?? 0);
}

export function buildPlumeGeometry(
  curve,
  controlPoints,
  tubularSegments,
  radialSegments,
  capSegments
) {
  const count = controlPoints.length;
  const radii = controlPoints.map((controlPoint) => controlPoint.radius ?? 1.0);
  const frames = curve.computeFrenetFrames(tubularSegments, false);

  const positions = [];
  const normals = [];
  const arcTs = [];
  const indices = [];

  const stride = radialSegments + 1;

  function getRadius(u) {
    const f = u * (count - 1);
    const lo = Math.floor(f);
    const hi = Math.min(lo + 1, count - 1);
    const weight = f - lo;
    return radii[lo] * (1 - weight) + radii[hi] * weight;
  }

  for (let i = 0; i <= tubularSegments; i += 1) {
    const u = i / tubularSegments;
    const point = curve.getPointAt(u);
    const normal = frames.normals[i];
    const binormal = frames.binormals[i];
    const radius = getRadius(u);

    for (let j = 0; j <= radialSegments; j += 1) {
      const theta = (j / radialSegments) * TWO_PI;
      const sinTheta = Math.sin(theta);
      const cosTheta = -Math.cos(theta);

      const nx = cosTheta * normal.x + sinTheta * binormal.x;
      const ny = cosTheta * normal.y + sinTheta * binormal.y;
      const nz = cosTheta * normal.z + sinTheta * binormal.z;

      positions.push(
        point.x + radius * nx,
        point.y + radius * ny,
        point.z + radius * nz
      );
      normals.push(nx, ny, nz);
      arcTs.push(u);
    }
  }

  for (let i = 0; i < tubularSegments; i += 1) {
    for (let j = 0; j < radialSegments; j += 1) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  function addCap(
    center,
    tangent,
    normal,
    binormal,
    radius,
    arcT,
    dir,
    tubeEdgeIdx
  ) {
    let previousRing = tubeEdgeIdx;

    for (let i = 1; i <= capSegments; i += 1) {
      const phi = (Math.PI / 2) * (i / capSegments);
      const ringRadius = radius * Math.cos(phi);
      const offset = dir * radius * Math.sin(phi);

      const ringStart = positions.length / 3;

      for (let j = 0; j <= radialSegments; j += 1) {
        const theta = (j / radialSegments) * TWO_PI;
        const sinTheta = Math.sin(theta);
        const cosTheta = -Math.cos(theta);

        const rx = cosTheta * normal.x + sinTheta * binormal.x;
        const ry = cosTheta * normal.y + sinTheta * binormal.y;
        const rz = cosTheta * normal.z + sinTheta * binormal.z;

        const hnx = Math.cos(phi) * rx + Math.sin(phi) * dir * tangent.x;
        const hny = Math.cos(phi) * ry + Math.sin(phi) * dir * tangent.y;
        const hnz = Math.cos(phi) * rz + Math.sin(phi) * dir * tangent.z;

        positions.push(
          center.x + offset * tangent.x + ringRadius * rx,
          center.y + offset * tangent.y + ringRadius * ry,
          center.z + offset * tangent.z + ringRadius * rz
        );
        normals.push(hnx, hny, hnz);
        arcTs.push(arcT);
      }

      for (let j = 0; j < radialSegments; j += 1) {
        const a = previousRing + j;
        const b = ringStart + j;
        const c = ringStart + (j + 1);
        const d = previousRing + (j + 1);

        if (dir > 0) {
          indices.push(a, b, d, b, c, d);
        } else {
          indices.push(a, d, b, b, d, c);
        }
      }

      previousRing = ringStart;
    }

    const poleIdx = positions.length / 3;
    positions.push(
      center.x + dir * radius * tangent.x,
      center.y + dir * radius * tangent.y,
      center.z + dir * radius * tangent.z
    );
    normals.push(dir * tangent.x, dir * tangent.y, dir * tangent.z);
    arcTs.push(arcT);

    for (let j = 0; j < radialSegments; j += 1) {
      if (dir > 0) {
        indices.push(previousRing + j, poleIdx, previousRing + j + 1);
      } else {
        indices.push(previousRing + j, previousRing + j + 1, poleIdx);
      }
    }
  }

  addCap(
    curve.getPointAt(0),
    curve.getTangentAt(0),
    frames.normals[0],
    frames.binormals[0],
    getRadius(0),
    0,
    -1,
    0
  );

  addCap(
    curve.getPointAt(1),
    curve.getTangentAt(1),
    frames.normals[tubularSegments],
    frames.binormals[tubularSegments],
    getRadius(1),
    1,
    1,
    tubularSegments * stride
  );

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('arcT', new THREE.Float32BufferAttribute(arcTs, 1));
  return geometry;
}
