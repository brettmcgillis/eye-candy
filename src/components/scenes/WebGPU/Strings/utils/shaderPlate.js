import { positionGeometry, uniform, uv, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

export function createPlateUniforms() {
  return {
    resolution: uniform(new THREE.Vector2(1, 1)),
    time: uniform(0),
    tint: uniform(new THREE.Color(1, 1, 1)),
    plateBrightness: uniform(1),
    plateThreadAmplitude: uniform(0.2),
    plateThreadFrequency: uniform(12),
    plateThreadEdge: uniform(0.009),
    plateThreadSpacing: uniform(250),
    plateThreadNoise: uniform(2.5),
    plateRingRadius: uniform(0.37),
    plateRingNoise: uniform(0.12),
    plateRingGlow: uniform(0.0008),
    plateRingLoopSpeed: uniform(0.3),
    plateRingLobes: uniform(5),
  };
}

export function centeredUV(u) {
  const fragCoord = uv().mul(u.resolution);

  return fragCoord.sub(u.resolution.mul(0.5)).div(u.resolution.y);
}

export function createPlateMaterial(colorNode) {
  const material = new THREE.MeshBasicNodeMaterial({
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  material.vertexNode = vec4(positionGeometry.xy, 0, 1);
  material.colorNode = colorNode;

  return material;
}
