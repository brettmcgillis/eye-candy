import {
  mx_noise_float as perlin,
  positionWorld,
  uniform,
  vertexColor,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

// Rubber: a soft sheen along each cable, faintly mottled (ControlPanel's).
export function createCableMaterial() {
  const uniforms = { roughness: uniform(0.45) };
  const material = new THREE.MeshStandardNodeMaterial({
    metalness: 0,
    vertexColors: true,
  });
  const mottle = perlin(positionWorld.mul(35));
  material.colorNode = vertexColor().rgb.mul(mottle.mul(0.06).add(1));
  material.roughnessNode = perlin(positionWorld.mul(9))
    .mul(0.08)
    .add(uniforms.roughness);
  return { material, uniforms };
}

export function createFloorMaterial() {
  const uniforms = {
    color: uniform(new THREE.Color('#8b8780')),
    roughness: uniform(0.8),
  };
  const material = new THREE.MeshStandardNodeMaterial({ metalness: 0 });
  const grain = perlin(positionWorld.mul(7)).mul(0.04);
  const speck = perlin(positionWorld.mul(90)).mul(0.03);
  material.colorNode = uniforms.color.mul(grain.add(speck).add(1));
  material.roughnessNode = uniforms.roughness;
  return { material, uniforms };
}

export function createShaftMaterial() {
  return new THREE.MeshStandardNodeMaterial({
    color: '#070707',
    metalness: 0,
    roughness: 1,
    side: THREE.BackSide,
  });
}

export function createPlugMaterial() {
  const uniforms = { color: uniform(new THREE.Color('#a7a9ad')) };
  const material = new THREE.MeshStandardNodeMaterial({
    metalness: 1,
    roughness: 0.32,
  });
  material.colorNode = uniforms.color;
  return { material, uniforms };
}
