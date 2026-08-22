import { mix, normalWorld, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';

// Debug-only shell for the reveal toggle. Fake hemispheric shading reads the
// form without needing a light in an otherwise unlit scene, and it never writes
// depth so rain in front of and behind the target both stay visible.
export default function createGhostMaterial() {
  const material = new THREE.MeshBasicNodeMaterial();

  material.colorNode = mix(
    vec3(0.04, 0.06, 0.09),
    vec3(0.34, 0.44, 0.54),
    normalWorld.y.mul(0.5).add(0.5)
  );
  material.opacity = 0.45;
  material.transparent = true;
  material.depthWrite = false;
  material.side = THREE.DoubleSide;

  return material;
}
