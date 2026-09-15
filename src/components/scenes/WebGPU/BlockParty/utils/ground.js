import * as THREE from 'three/webgpu';

import { isOpening } from './instances';

// Ellipse curves emit two points per segment, so this lands on the same 128
// rim vertices as the pedestal cylinder.
const RIM_SEGMENTS = 128;

function traceRect(path, rect) {
  path.moveTo(rect.x, -rect.y);
  path.lineTo(rect.x + rect.w, -rect.y);
  path.lineTo(rect.x + rect.w, -(rect.y + rect.h));
  path.lineTo(rect.x, -(rect.y + rect.h));
  path.closePath();

  return path;
}

function outline(shape, radius) {
  if (shape === 'circle') {
    const disc = new THREE.Shape();

    disc.absarc(0, 0, radius, 0, Math.PI * 2, false);

    return disc;
  }

  return traceRect(new THREE.Shape(), {
    h: radius * 2,
    w: radius * 2,
    x: -radius,
    y: -radius,
  });
}

// The pedestal's lid, with every pit and stair well cut through it.
export default function createGroundGeometry({ cells, radius, shape }) {
  const lid = outline(shape, radius);

  cells
    .filter((cell) => isOpening(cell) && cell.valid)
    .forEach((cell) => lid.holes.push(traceRect(new THREE.Path(), cell.rect)));

  const geometry = new THREE.ShapeGeometry(lid, RIM_SEGMENTS / 2);

  geometry.rotateX(-Math.PI / 2);

  return geometry;
}
