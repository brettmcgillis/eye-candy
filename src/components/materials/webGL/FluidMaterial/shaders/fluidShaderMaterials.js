import * as THREE from 'three';

import { fullscreenVertexShader, simVertexShader } from './fluidShaders';

function createSimMaterial(fragmentShader, uniforms) {
  return new THREE.ShaderMaterial({
    vertexShader: simVertexShader,
    fragmentShader,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });
}

function createFullscreenMaterial(fragmentShader, uniforms) {
  return new THREE.ShaderMaterial({
    vertexShader: fullscreenVertexShader,
    fragmentShader,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });
}

export { createSimMaterial, createFullscreenMaterial };
