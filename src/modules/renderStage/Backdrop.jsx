import { useLayoutEffect } from 'react';

import { useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

// The scene background and clear colour as one; null clears to alpha 0, so
// a PNG or WebP keeps a transparent backdrop.
export default function Backdrop({ color }) {
  const { gl, scene } = useThree();
  useLayoutEffect(() => {
    scene.background = color ? new THREE.Color(color) : null;
    gl.setClearColor(color ?? '#000000', color ? 1 : 0);
  }, [color, gl, scene]);
  return null;
}
