import {
  attribute,
  mix,
  positionGeometry,
  smoothstep,
  uniform,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

// How much of the growth timeline a tube tip takes to round out.
const TIP = 0.03;

export function createTubeUniforms() {
  return {
    clearcoat: uniform(0.3),
    growth: uniform(2),
    metalness: uniform(0),
    roughness: uniform(0.42),
  };
}

// Vertex colours from the lane palette. Growth collapses every vertex not
// yet reached onto its centreline point, so a strand extrudes with a
// tapering tip rather than popping in ring by ring.
export function createTubeMaterial(uniforms) {
  const center = attribute('aCenter', 'vec4');
  const reveal = smoothstep(center.w, center.w.add(TIP), uniforms.growth);
  const material = new THREE.MeshPhysicalNodeMaterial();
  material.positionNode = mix(center.xyz, positionGeometry, reveal);
  material.colorNode = attribute('color', 'vec3');
  material.roughnessNode = uniforms.roughness;
  material.metalnessNode = uniforms.metalness;
  material.clearcoatNode = uniforms.clearcoat;
  material.clearcoatRoughnessNode = uniforms.roughness.mul(0.5);
  return material;
}

export function createFloorMaterial() {
  const color = uniform(new THREE.Color('#ece7dc'));
  const material = new THREE.MeshStandardNodeMaterial({ roughness: 0.95 });
  material.colorNode = color;
  return { color, material };
}
