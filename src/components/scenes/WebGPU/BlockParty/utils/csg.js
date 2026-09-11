import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import * as THREE from 'three/webgpu';

const evaluator = new Evaluator();
evaluator.useGroups = false;

export function createBox({ depth, height, position, rotationY = 0, width }) {
  const brush = new Brush(new THREE.BoxGeometry(width, height, depth));

  brush.position.set(position[0], position[1], position[2]);
  brush.rotation.y = rotationY;
  brush.updateMatrixWorld();

  return brush;
}

export function brushFromGeometry(geometry) {
  const brush = new Brush(geometry);
  brush.updateMatrixWorld();
  return brush;
}

// Sequential booleans re-BVH the growing result, so cost climbs superlinearly
// — 64 one-at-a-time cuts measured ~2.3s against ~13ms for the same cuts
// merged into a single cutter. Variants are the only thing carved here, and
// each takes two or three cuts against a tiny brush, so they stay cheap.
export function cut(base, cutter, operation = SUBTRACTION) {
  const result = evaluator.evaluate(base, cutter, operation);
  result.updateMatrixWorld();
  return result;
}

export function cutToGeometry(base, cutter, operation = SUBTRACTION) {
  const geometry = cut(base, cutter, operation).geometry.clone();
  geometry.computeVertexNormals();
  return geometry;
}
