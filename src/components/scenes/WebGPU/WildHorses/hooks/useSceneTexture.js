import { useTexture } from '@react-three/drei';

import * as THREE from 'three/webgpu';

import { textureFile } from '@utils/appUtils';

// drei leaves colorSpace at the three default, which reads these authored
// color maps as linear and washes the whole field out.
export default function useSceneTexture(fileName) {
  const map = useTexture(textureFile(fileName));
  map.colorSpace = THREE.SRGBColorSpace;

  return map;
}
