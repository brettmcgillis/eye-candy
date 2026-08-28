import * as THREE from 'three/webgpu';

const FACES = [
  {
    normal: [0, -1, 0],
    corners: [
      [0, 0.5, -0.5],
      [0, 0.5, 0.5],
      [1, 0.5, 0.5],
      [1, 0.5, -0.5],
    ],
  },
  {
    normal: [0, 1, 0],
    corners: [
      [0, -0.5, -0.5],
      [1, -0.5, -0.5],
      [1, -0.5, 0.5],
      [0, -0.5, 0.5],
    ],
  },
  {
    normal: [0, 0, -1],
    corners: [
      [0, -0.5, 0.5],
      [1, -0.5, 0.5],
      [1, 0.5, 0.5],
      [0, 0.5, 0.5],
    ],
  },
  {
    normal: [0, 0, 1],
    corners: [
      [0, -0.5, -0.5],
      [0, 0.5, -0.5],
      [1, 0.5, -0.5],
      [1, -0.5, -0.5],
    ],
  },
  {
    normal: [-1, 0, 0],
    corners: [
      [1, -0.5, -0.5],
      [1, 0.5, -0.5],
      [1, 0.5, 0.5],
      [1, -0.5, 0.5],
    ],
  },
];

export default function createTunnelGeometry() {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  FACES.forEach((face, faceIndex) => {
    face.corners.forEach((corner) => {
      positions.push(...corner);
      normals.push(...face.normal);
      uvs.push(corner[0], corner[1] + 0.5);
    });
    const base = faceIndex * 4;
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}
