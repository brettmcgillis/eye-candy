import * as THREE from 'three/webgpu';

// x runs along a segment (0..1), z up a wall (0..1).
export function createWallTemplate() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1], 3)
  );
  geometry.setIndex([0, 1, 2, 2, 1, 3]);
  return geometry;
}

// A box along a segment: x along (0..1), y across (-1 right, 1 left), z up
// (0..1); aFace names the face for its normal (0 top, 1 left, 2 right,
// 3 start, 4 end). The underside is never seen.
export function createBoxTemplate() {
  const faces = [
    [0, [0, -1, 1], [1, -1, 1], [0, 1, 1], [1, 1, 1]],
    [1, [0, 1, 0], [0, 1, 1], [1, 1, 0], [1, 1, 1]],
    [2, [0, -1, 0], [1, -1, 0], [0, -1, 1], [1, -1, 1]],
    [3, [0, -1, 0], [0, -1, 1], [0, 1, 0], [0, 1, 1]],
    [4, [1, -1, 0], [1, 1, 0], [1, -1, 1], [1, 1, 1]],
  ];
  const position = [];
  const face = [];
  const index = [];
  faces.forEach(([id, ...corners]) => {
    const o = position.length / 3;
    corners.forEach((c) => {
      position.push(...c);
      face.push(id);
    });
    index.push(o, o + 1, o + 2, o + 2, o + 1, o + 3);
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(position, 3)
  );
  geometry.setAttribute('aFace', new THREE.Float32BufferAttribute(face, 1));
  geometry.setIndex(index);
  return geometry;
}

export function createPlane(aspect) {
  return new THREE.PlaneGeometry(2 * aspect, 2, 1, 1);
}

// The four outer walls round the domain, 0..1 high (the material scales
// them), each with its outward direction.
export function createSkirts(aspect) {
  const a = aspect;
  const sides = [
    [
      [-a, -1],
      [a, -1],
      [0, -1],
    ],
    [
      [a, -1],
      [a, 1],
      [1, 0],
    ],
    [
      [a, 1],
      [-a, 1],
      [0, 1],
    ],
    [
      [-a, 1],
      [-a, -1],
      [-1, 0],
    ],
  ];
  const position = [];
  const out = [];
  sides.forEach(([p, q, n]) => {
    [
      [p, 0],
      [q, 0],
      [p, 1],
      [p, 1],
      [q, 0],
      [q, 1],
    ].forEach(([[x, y], z]) => {
      position.push(x, y, z);
      out.push(...n);
    });
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(position, 3)
  );
  geometry.setAttribute('aOut', new THREE.Float32BufferAttribute(out, 2));
  return geometry;
}
