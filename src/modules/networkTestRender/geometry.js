import * as THREE from 'three/webgpu';

// x runs along a link (0..1), y across it (-1..1).
export function createRibbonGeometry() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([0, -1, 0, 1, -1, 0, 0, 1, 0, 1, 1, 0], 3)
  );
  geometry.setIndex([0, 1, 2, 2, 1, 3]);
  return geometry;
}

export function createSpriteGeometry() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      [-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0],
      3
    )
  );
  geometry.setIndex([0, 1, 2, 2, 1, 3]);
  return geometry;
}
