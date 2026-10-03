import * as THREE from 'three/webgpu';

import { createTubeGeometry } from '@modules/gpuTubes';

export const RADIAL_SEGMENTS = 8;
export const RINGS_PER_BEAD = 2;
const FILLET = 0.12;
const FILLET_STEPS = 8;

function cylinderProfile() {
  const profile = [new THREE.Vector2(0, 0), new THREE.Vector2(1 - FILLET, 0)];
  for (let i = 1; i <= FILLET_STEPS; i += 1) {
    const a = (i / FILLET_STEPS) * Math.PI * 0.5;
    profile.push(
      new THREE.Vector2(
        1 - FILLET + Math.sin(a) * FILLET,
        -FILLET + Math.cos(a) * FILLET
      )
    );
  }
  profile.push(new THREE.Vector2(1, -1), new THREE.Vector2(0, -1));
  return profile.reverse();
}

// Unit radius, front cap at z = 0; `back` marks the ring the material pins to
// the back wall.
export function createCylinderGeometry(count) {
  const lathe = new THREE.LatheGeometry(cylinderProfile(), 64);
  lathe.rotateX(Math.PI / 2);
  const geometry = new THREE.InstancedBufferGeometry().copy(lathe);
  lathe.dispose();
  const z = geometry.attributes.position;
  const back = new Float32Array(z.count);
  for (let i = 0; i < z.count; i += 1) back[i] = z.getZ(i) < -0.5 ? 1 : 0;
  geometry.setAttribute('back', new THREE.BufferAttribute(back, 1));
  geometry.instanceCount = count;
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity);
  return geometry;
}

export function createWireGeometry(layout) {
  return createTubeGeometry({
    instanceCount: layout.wireCount,
    radialSegments: RADIAL_SEGMENTS,
    tubularSegments: (layout.pointsPerWire - 1) * RINGS_PER_BEAD,
  });
}

export function createPanelGeometry(mesh) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(mesh.positions, 3)
  );
  geometry.setAttribute('normal', new THREE.BufferAttribute(mesh.normals, 3));
  geometry.setIndex(new THREE.BufferAttribute(mesh.indices, 1));
  geometry.computeBoundingSphere();
  return geometry;
}
