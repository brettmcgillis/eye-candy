import * as THREE from 'three/webgpu';

// Pure parameter space: every vertex knows only how far along its curve it
// sits and where around the ring. The shape arrives in the material, so the
// triangles are uploaded once and never rebuilt. `position` is zeroed only to
// keep the pipeline happy, and the bounding volume is a lie — callers must
// disable frustum culling.
export default function createTubeGeometry({
  instanceCount = 1,
  radialSegments = 3,
  tubularSegments = 90,
}) {
  const ringSize = radialSegments + 1;
  const vertexCount = (tubularSegments + 1) * ringSize;
  const progress = new Float32Array(vertexCount);
  const angle = new Float32Array(vertexCount);

  for (let i = 0; i <= tubularSegments; i += 1) {
    for (let j = 0; j <= radialSegments; j += 1) {
      const v = i * ringSize + j;
      progress[v] = i / tubularSegments;
      angle[v] = (j / radialSegments) * Math.PI * 2;
    }
  }

  const indices = [];
  for (let i = 0; i < tubularSegments; i += 1) {
    for (let j = 0; j < radialSegments; j += 1) {
      const a = i * ringSize + j;
      const b = (i + 1) * ringSize + j;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3)
  );
  geometry.setAttribute('progress', new THREE.BufferAttribute(progress, 1));
  geometry.setAttribute('angle', new THREE.BufferAttribute(angle, 1));
  geometry.instanceCount = instanceCount;
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity);

  return geometry;
}
