import React from 'react';

import { Canvas } from '@react-three/fiber';

import * as THREE from 'three';

import { useCanvasDpr } from '@hooks/useRenderScale';

export default function WebGLCanvas({ children }) {
  const dpr = useCanvasDpr();

  return (
    <Canvas
      dpr={dpr}
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
