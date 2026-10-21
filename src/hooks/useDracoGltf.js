import { useLoader } from '@react-three/fiber';

import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// drei's useGLTF without drei, whose bundle cannot load on the render
// workbenches' headless renderer. Same decoder drei uses.
const draco = new DRACOLoader().setDecoderPath(
  'https://www.gstatic.com/draco/versioned/decoders/1.5.5/'
);

const withDraco = (loader) => loader.setDRACOLoader(draco);

export default function useDracoGltf(url) {
  return useLoader(GLTFLoader, url, withDraco);
}

useDracoGltf.preload = (url) => useLoader.preload(GLTFLoader, url, withDraco);
