import React from 'react';

import { CuboidCollider, RigidBody } from '@react-three/rapier';

import GridMaterial from '../../../../../materials/webGL/gridMaterial';

export default function Floor({ gridSectionColor, gridCellColor }) {
  return (
    <>
      <mesh
        position={[0, -1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={0}
        userData={{ camExcludeCollision: true }}
      >
        <planeGeometry args={[300, 300]} />
        <GridMaterial
          gridSize={1}
          lineWidth={0.8}
          bgColor={gridSectionColor}
          lineColor={gridCellColor}
        />
      </mesh>

      <mesh
        receiveShadow
        renderOrder={1}
        position={[0, -0.98, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        userData={{ camExcludeCollision: true }}
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
