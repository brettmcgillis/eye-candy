import * as THREE from 'three/webgpu';

import React from 'react';

import { Canvas } from '@react-three/fiber';

export default function WebGPUCanvas({ children }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      shadows="soft"
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
