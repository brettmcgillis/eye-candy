import React from 'react';

import { useThree } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';

import WebGLGridMaterial from '../../../../materials/webGL/gridMaterial';
import { GridMaterial as WebGPUGridMaterial } from '../../../../materials/webGPU/gridMaterial';

export default function Floor({
  gridSectionColor,
  gridCellColor,
  onPointerMove,
  onPointerDown,
  onPointerUp,
}) {
  const { gl } = useThree();
  const isWebGPU = gl?.isWebGPURenderer === true;
  const GridMaterial = isWebGPU ? WebGPUGridMaterial : WebGLGridMaterial;
  const lineWidth = isWebGPU ? 0.03 : 0.8;

  return (
    <>
      <mesh
        position={[0, -1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={0}
        userData={{ camExcludeCollision: true }}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <planeGeometry args={[300, 300]} />
        <GridMaterial
          gridSize={1}
          lineWidth={lineWidth}
          bgColor={gridSectionColor}
          lineColor={gridCellColor}
        />
      </mesh>

      <mesh
        receiveShadow
        renderOrder={1}
        position={[0, -0.98, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[300, 300]} />
        <shadowMaterial
          opacity={0.35}
          transparent
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-4}
          polygonOffsetUnits={-4}
        />
      </mesh>

      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[150, 2.5, 150]} position={[0, -3.5, 0]} />
      </RigidBody>
    </>
  );
}
