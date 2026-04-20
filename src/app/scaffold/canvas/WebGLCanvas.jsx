import React from 'react';

import { Canvas } from '@react-three/fiber';

export default function WebGLCanvas({ children }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      shadows="soft"
      gl={{
        antialias: false,
        preserveDrawingBuffer: true,
        depth: true,
        alpha: true,
      }}
    >
      {children}
    </Canvas>
  );
}
