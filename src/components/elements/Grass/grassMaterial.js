import * as THREE from 'three/webgpu';

import bezierBlade from './bezierBlade';
import bladeFrame from './bladeFrame';
import straightBlade from './straightBlade';

const BLADES = { bezier: bezierBlade, straight: straightBlade };

export default function createGrassMaterial({
  blade = 'bezier',
  chunkOffsetX,
  chunkOffsetZ,
  roughness = 0.85,
  store,
  uniforms,
  ...options
}) {
  const material = new THREE.MeshStandardNodeMaterial({
    metalness: 0,
    roughness,
    side: THREE.DoubleSide,
  });
  const frame = bladeFrame({ chunkOffsetX, chunkOffsetZ, store });
  const { colorNode, normalNode, positionNode } = BLADES[blade](
    frame,
    uniforms,
    options
  );
  material.positionNode = positionNode;
  material.normalNode = normalNode;
  material.colorNode = colorNode;
  return material;
}
