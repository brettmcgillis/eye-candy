import React from 'react';

import { MeshTransmissionMaterial } from '@react-three/drei';

import Cube from './Cube';

export default function DoubleCube({
  position,
  rotation = [0.2, 0.35, 0.1],
  coreScale = 0.87,
  glassColor = '#5ab6ff',
  transmission = 0.98,
  thickness = 0.42,
  ior = 1.25,
  chromaticAberration = 0.025,
  ...shapeProps
}) {
  return (
    <group position={position}>
      <Cube rotation={rotation} {...shapeProps} />
      <mesh rotation={rotation} scale={coreScale}>
        <boxGeometry args={[1.25, 1.25, 1.25, 12, 12, 12]} />
        <MeshTransmissionMaterial
          color={glassColor}
          transmission={transmission}
          thickness={thickness}
          roughness={0}
          ior={ior}
          chromaticAberration={chromaticAberration}
        />
      </mesh>
    </group>
  );
}
