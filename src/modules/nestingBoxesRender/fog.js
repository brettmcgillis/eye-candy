/* eslint-disable no-param-reassign */
import { fog, rangeFogFactor, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

// `shift` moves the fog band with the camera: a headless view framed farther
// out than the scene camera keeps the haze the scene shows.
export default function createFog() {
  const uniforms = {
    color: uniform(new THREE.Color()),
    far: uniform(20),
    near: uniform(6),
  };

  return {
    node: fog(
      uniforms.color,
      rangeFogFactor(uniforms.near, uniforms.far.max(uniforms.near.add(0.01)))
    ),
    uniforms,
    apply(config, shift = 0) {
      uniforms.color.value.set(config.fogColor);
      uniforms.near.value = config.fogNear + shift;
      uniforms.far.value = config.fogFar + shift;
    },
  };
}
