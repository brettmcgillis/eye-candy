import { texture as textureSample, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { useMemo } from 'react';

import { useTexture } from '@react-three/drei';

import { textureFile } from '../../../utils/appUtils';

useTexture.preload(textureFile('moonTexture.jpg'));

export default function WebGPUMoon({
  position = [0, 0, 0],
  scale = 1,
  rotation = [0, 0, 0],
  radius = 1,
  segments = 64,
  color: colorProp = '#ffffff',
  emissive: emissiveProp = '#000000',
  emissiveIntensity = 0,
  // When true the emissive glow carries the moon texture (self-lit moon
  // that still shows its craters) instead of a flat color wash.
  emissiveUsesTexture = false,
  // Pass false to opt the moon out of scene fog (custom fogNode included) —
  // a distant moon otherwise gets flattened into the haze color.
  fog: fogProp = true,
  metalness = 0.1,
  roughness = 0.8,
  ...props
}) {
  // Load moon texture
  const texture = useTexture(textureFile('moonTexture.jpg'));

  // Optimize texture
  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
  }, [texture]);

  // Create material with TSL
  const material = useMemo(() => {
    const baseColor = new THREE.Color(colorProp);
    const emissiveColor = new THREE.Color(emissiveProp);

    const mat = new THREE.MeshStandardNodeMaterial({
      colorNode: textureSample(new THREE.TextureNode(texture)),
      color: baseColor,
      emissive: emissiveColor,
      emissiveIntensity,
      metalness,
      roughness,
    });

    if (emissiveUsesTexture && emissiveIntensity > 0) {
      mat.emissiveNode = textureSample(new THREE.TextureNode(texture))
        .rgb.mul(vec3(emissiveColor.r, emissiveColor.g, emissiveColor.b))
        .mul(emissiveIntensity);
    }

    mat.fog = fogProp;

    return mat;
  }, [
    texture,
    colorProp,
    emissiveProp,
    emissiveIntensity,
    emissiveUsesTexture,
    fogProp,
    metalness,
    roughness,
  ]);

  return (
    <mesh
      position={position}
      scale={scale}
      rotation={rotation}
      material={material}
      {...props}
    >
      <sphereGeometry args={[radius, segments, segments]} />
    </mesh>
  );
}
