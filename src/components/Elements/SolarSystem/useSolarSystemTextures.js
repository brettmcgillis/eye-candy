import * as THREE from 'three';

import { useEffect } from 'react';

import { useTexture } from '@react-three/drei';

import {
  COLOR_TEXTURE_KEYS,
  LINEAR_TEXTURE_KEYS,
  SOLAR_SYSTEM_TEXTURE_PATHS,
} from './solarSystem.constants';

export default function useSolarSystemTextures() {
  const textures = useTexture(SOLAR_SYSTEM_TEXTURE_PATHS);

  useEffect(() => {
    COLOR_TEXTURE_KEYS.forEach((key) => {
      const texture = textures[key];
      if (!texture) {
        return;
      }

      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
    });

    LINEAR_TEXTURE_KEYS.forEach((key) => {
      const texture = textures[key];
      if (!texture) {
        return;
      }

      texture.colorSpace = THREE.NoColorSpace;
      texture.anisotropy = 4;
    });
  }, [textures]);

  return textures;
}
