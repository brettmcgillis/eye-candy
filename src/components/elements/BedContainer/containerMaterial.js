import * as THREE from 'three/webgpu';

import createCausticShadowNode from './causticShadow';

// Clear and Glass differ in cost, not much in look from overhead: Glass runs a
// real transmission pass and refracts what is behind the wall, which only pays
// off once the camera comes off the top-down axis.
export default function buildContainerMaterial(config, caustics) {
  if (!caustics)
    throw new Error('bedShape: container material needs caustic uniforms');

  const common = {
    color: new THREE.Color(config.containerColor),
    metalness: config.containerMetalness,
    roughness: config.containerRoughness,
  };

  if (config.containerMaterial === 'Matte') {
    return new THREE.MeshStandardNodeMaterial(common);
  }

  // Without this a transmissive container casts nothing at all and the bed it
  // stands in has no contact shadow, so the whole thing reads as floating.

  const material = new THREE.MeshPhysicalNodeMaterial({
    ...common,
    ior: config.containerIor,
    opacity: config.containerOpacity,
    transparent: true,
  });

  if (config.containerMaterial === 'Glass') {
    material.transmission = 1;
    material.thickness = config.containerThickness;
    // Transmission carries the colour through attenuation, so an opacity
    // below 1 on top of it just fogs the refraction.
    material.opacity = 1;
    material.attenuationColor = new THREE.Color(config.containerColor);
    material.attenuationDistance = Math.max(
      0.01,
      config.containerThickness * 4
    );
  }

  material.castShadowNode = createCausticShadowNode(caustics);

  return material;
}
