import * as THREE from 'three/webgpu';

import React from 'react';

import { Canvas } from '@react-three/fiber';

export default function WebGPUCanvas({ children }) {
  return (
    <Canvas
      shadows="basic"
      gl={async (props) => {
        const renderer = new THREE.WebGPURenderer({
          ...props,
          antialias: true,
          alpha: false,
        });

        await renderer.init();
        return renderer;
      }}
    >
      {children}
    </Canvas>
  );
}
