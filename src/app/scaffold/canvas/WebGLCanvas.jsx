import * as THREE from 'three';

import React from 'react';

import { Canvas } from '@react-three/fiber';

export default function WebGLCanvas({ children }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      shadows
      style={{ touchAction: 'none' }}
      gl={{
        antialias: false,
        preserveDrawingBuffer: true,
        depth: true,
        alpha: true,
        stencil: true,
      }}
      onCreated={({ gl }) => {
        const renderer = gl;

        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
    >
      {children}
    </Canvas>
  );
}
