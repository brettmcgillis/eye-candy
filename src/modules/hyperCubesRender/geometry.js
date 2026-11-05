import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as THREE from 'three/webgpu';

import {
  CYLINDER_SEGMENTS,
  HOLLOW_CYLINDER_INNER_RADIUS,
} from '@modules/hyperCubes';

function createHollowCylinderGeometry() {
  const inner = HOLLOW_CYLINDER_INNER_RADIUS;
  const profile = [
    [inner, -1],
    [1, -1],
    [1, 1],
    [inner, 1],
  ];
  const faces = profile.map((point, i) => {
    const next = profile[(i + 1) % profile.length];
    return new THREE.LatheGeometry(
      [new THREE.Vector2(...point), new THREE.Vector2(...next)],
      CYLINDER_SEGMENTS
    );
  });
  const geometry = mergeGeometries(faces);
  faces.forEach((face) => face.dispose());
  return geometry;
}

export function createCellGeometry(shape) {
  switch (shape) {
    case 'sphere':
      return new THREE.SphereGeometry(1, 32, 16);
    case 'cylinder':
      return new THREE.CylinderGeometry(1, 1, 2, CYLINDER_SEGMENTS);
    case 'hollowCylinder':
      return createHollowCylinderGeometry();
    default:
      return new THREE.BoxGeometry(2, 2, 2);
  }
}

// The rect reference's frame: a box `width` larger than the cell with its
// three face slabs cut away, i.e. twelve bars. `position` is the corner sign
// the cell's half extents scale, `aOffset` the sign the bar width scales, so
// a bar keeps its width on any cell.
export function createFrameGeometry() {
  const bar = new THREE.BoxGeometry(2, 2, 2).toNonIndexed();
  const barPositions = bar.getAttribute('position').array;
  const barNormals = bar.getAttribute('normal').array;
  const vertices = barPositions.length / 3;
  const positions = [];
  const offsets = [];
  const normals = [];

  for (let along = 0; along < 3; along += 1) {
    const [b, c] = [0, 1, 2].filter((axis) => axis !== along);
    [-1, 1].forEach((sb) => {
      [-1, 1].forEach((sc) => {
        for (let v = 0; v < vertices; v += 1) {
          const p = barPositions.slice(v * 3, v * 3 + 3);
          const sign = [0, 0, 0];
          sign[along] = p[along];
          sign[b] = sb;
          sign[c] = sc;
          positions.push(...sign);
          offsets.push(...p);
          normals.push(...barNormals.slice(v * 3, v * 3 + 3));
        }
      });
    });
  }
  bar.dispose();

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute(
    'aOffset',
    new THREE.Float32BufferAttribute(offsets, 3)
  );
  return geometry;
}

export function createFloorGeometry() {
  const geometry = new THREE.PlaneGeometry(400, 400);
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}
