import * as THREE from 'three/webgpu';

// One ribbon per strand. `samples` is a render-side resolution, independent of
// the simulated point count: the vertex shader walks a Catmull-Rom spline
// through the points, so a strand can be smooth without simulating more of it.
export default function createRibbonGeometry(samples) {
  const positions = new Float32Array(samples * 2 * 3);
  const indices = [];

  for (let s = 0; s < samples; s += 1) {
    const along = s / (samples - 1);

    positions.set([along, -1, 0], s * 6);
    positions.set([along, 1, 0], s * 6 + 3);

    if (s < samples - 1) {
      const a = s * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);

  return geometry;
}
