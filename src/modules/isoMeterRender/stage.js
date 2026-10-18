import * as THREE from 'three/webgpu';

export const VIEW_AXIS = new THREE.Vector3(1, 1, 1).normalize();

const MIRROR_X = new THREE.Matrix4().set(
  0,
  0,
  1,
  0,
  0,
  1,
  0,
  0,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  1
);

const MIRROR_Y = new THREE.Matrix4().set(
  2 / 3,
  2 / 3,
  -1 / 3,
  0,
  2 / 3,
  -1 / 3,
  2 / 3,
  0,
  -1 / 3,
  2 / 3,
  2 / 3,
  0,
  0,
  0,
  0,
  1
);

export function stageMatrix(target, scale, { mirroredX, mirroredY }) {
  target.makeScale(scale, scale, scale);
  if (mirroredX) target.multiply(MIRROR_X);
  if (mirroredY) target.multiply(MIRROR_Y);
  return target;
}

export function boxEdges(I, J, K) {
  const corners = [];
  [0, I].forEach((x) =>
    [0, J].forEach((y) => [0, K].forEach((z) => corners.push([x, y, z])))
  );
  const out = [];
  corners.forEach((a, n) => {
    corners.slice(n + 1).forEach((b) => {
      const diff = [0, 1, 2].filter((axis) => a[axis] !== b[axis]).length;
      if (diff === 1) out.push(...a, ...b);
    });
  });
  return Float32Array.from(out);
}
