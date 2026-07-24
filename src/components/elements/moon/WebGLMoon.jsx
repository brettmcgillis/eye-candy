import * as THREE from 'three';

import React, { useMemo } from 'react';

import { useTexture } from '@react-three/drei';

import { textureFile } from '../../../utils/appUtils';

useTexture.preload(textureFile('moonTexture.jpg'));

export default function WebGLMoon({
  position = [0, 0, 0],
  scale = 1,
  rotation = [0, 0, 0],
  radius = 1,
  segments = 64,
  color = '#ffffff',
  emissive = '#000000',
  emissiveIntensity = 0,
  metalness = 0.1,
  roughness = 0.8,
  toneMapped = true,
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

  // Create material
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: texture,
        color,
        emissive,
        emissiveIntensity,
        metalness,
        roughness,
        toneMapped,
      }),
    [
      texture,
      color,
      emissive,
      emissiveIntensity,
      metalness,
      roughness,
      toneMapped,
    ]
  );

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
