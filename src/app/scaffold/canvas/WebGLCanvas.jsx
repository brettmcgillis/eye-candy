import * as THREE from 'three';

import React from 'react';

import { Canvas } from '@react-three/fiber';

export default function WebGLCanvas({ children }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      shadows
      gl={{
        antialias: false,
        preserveDrawingBuffer: true,
        depth: true,
        alpha: true,
      }}
      onCreated={({ gl }) => {
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
    >
      {children}
    </Canvas>
  );
}
