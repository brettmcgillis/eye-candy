import * as THREE from 'three/webgpu';

import { isOpening } from './instances';

function tracePath(path, rect) {
  path.moveTo(rect.x, -rect.y);
  path.lineTo(rect.x + rect.w, -rect.y);
  path.lineTo(rect.x + rect.w, -(rect.y + rect.h));
  path.lineTo(rect.x, -(rect.y + rect.h));
  path.closePath();

  return path;
}

// One paper tile per district with the pits and stair wells cut through it,
// so a rolling rebuild only re-triangulates the district it replaces.
export default function createGroundGeometry(bounds, cells) {
  const shape = tracePath(new THREE.Shape(), bounds);

  cells
    .filter((cell) => isOpening(cell) && cell.valid)
    .forEach((cell) =>
      shape.holes.push(tracePath(new THREE.Path(), cell.rect))
    );

  const geometry = new THREE.ShapeGeometry(shape);

  geometry.rotateX(-Math.PI / 2);

  return geometry;
}
