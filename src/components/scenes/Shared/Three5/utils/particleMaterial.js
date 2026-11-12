/* eslint-disable no-param-reassign */
import { DoubleSide, MeshBasicMaterial } from 'three';
import { attribute, texture } from 'three/tsl';
import { MeshBasicNodeMaterial } from 'three/webgpu';

export default function particleMaterial(map, webgpu, config) {
  const options = {
    transparent: true,
    depthWrite: config.particleDepth,
    side: DoubleSide,
    alphaTest: 0.003,
    toneMapped: false,
  };
  if (webgpu) {
    const material = new MeshBasicNodeMaterial(options);
    const stamp = texture(map);
    material.colorNode = stamp.rgb.mul(attribute('particleTint', 'vec3'));
    material.opacityNode = stamp.a
      .mul(attribute('particleAlpha', 'float'))
      .mul(config.particleOpacity);
    return material;
  }
  const material = new MeshBasicMaterial({
    ...options,
    map,
    opacity: config.particleOpacity,
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = `attribute float particleAlpha; attribute vec3 particleTint; varying float vParticleAlpha; varying vec3 vParticleTint;\n${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvParticleAlpha = particleAlpha; vParticleTint = particleTint;'
    );
    shader.fragmentShader = `varying float vParticleAlpha; varying vec3 vParticleTint;\n${shader.fragmentShader}`;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      '#include <color_fragment>\ndiffuseColor.a *= vParticleAlpha; diffuseColor.rgb *= vParticleTint;'
    );
  };
  material.customProgramCacheKey = () => 'three5-particle-fade-v1';
  return material;
}
