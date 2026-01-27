import React from 'react';

import { Canvas } from '@react-three/fiber';

export default function WebGLCanvas({ children }) {
  return (
    <Canvas shadows gl={{ preserveDrawingBuffer: true, depth: true }}>
      {children}
    </Canvas>
  );
}
