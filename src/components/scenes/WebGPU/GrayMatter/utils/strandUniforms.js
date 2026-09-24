/* eslint-disable no-param-reassign */
import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

export const STRAND_UNIFORM_KEYS = [
  'bodyRadius',
  'crowdThinning',
  'hyphaRadius',
  'pulseSpeed',
  'roughness',
  'swellHigh',
  'swellLow',
];

export const STRAND_COLOR_KEYS = ['bodyColor', 'hyphaColor'];

export function createStrandUniforms() {
  const uniforms = { phase: uniform(0) };
  STRAND_UNIFORM_KEYS.forEach((key) => {
    uniforms[key] = uniform(0);
  });
  STRAND_COLOR_KEYS.forEach((key) => {
    uniforms[key] = uniform(new THREE.Color());
  });
  return uniforms;
}

export function syncStrandUniforms(uniforms, config) {
  STRAND_UNIFORM_KEYS.forEach((key) => {
    uniforms[key].value = config[key];
  });
  STRAND_COLOR_KEYS.forEach((key) => {
    uniforms[key].value.set(config[key]);
  });
}
