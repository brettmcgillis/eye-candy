import * as THREE from 'three/webgpu';

const SEGMENTS = 5;

export default function createBladeGeometry(segments = SEGMENTS) {
  const positions = [];
  const indices = [];

  for (let row = 0; row < segments; row += 1) {
    const t = row / segments;
    const half = 0.5 * (1 - t ** 1.6);
    positions.push(-half, t, 0, half, t, 0);

    if (row > 0) {
      const left = row * 2;
      const prev = left - 2;
      indices.push(prev, prev + 1, left + 1, prev, left + 1, left);
    }
  }

  const tip = segments * 2;
  const last = tip - 2;
  positions.push(0, 1, 0);
  indices.push(last, last + 1, tip);

  const blade = new THREE.InstancedBufferGeometry();
  blade.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  blade.setIndex(indices);

  return blade;
}
