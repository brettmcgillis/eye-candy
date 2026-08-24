import React from 'react';

import * as THREE from 'three/webgpu';

import { GridMaterial } from '@materials/WebGPU/gridMaterial';

const DEFAULT_SIZE = 2000;
const DEFAULT_GRID_SIZE = 100;

export default function GridBoxGPU({
  bgColor = '#3a4a5c',
  lineColor = '#1a2330',
  lineWidth = 0.025,
  size = DEFAULT_SIZE,
  gridSize = DEFAULT_GRID_SIZE,
}) {
  const boxCenterY = size / 2 - size * 0.1;

  return (
    <mesh position={[0, boxCenterY, 0]}>
      <boxGeometry args={[size, size, size]} />
      <GridMaterial
        bgColor={bgColor}
        lineColor={lineColor}
        lineWidth={lineWidth}
        gridSize={gridSize}
        roughness={1}
        metalness={0}
        side={THREE.BackSide}
      />
    </mesh>
  );
}
