import React from 'react';

import { MeshTransmissionMaterial } from '@react-three/drei';

import Plane from './Plane';

export default function DoublePlane({
  position,
  rotation = [-0.5, 0.4, 0],
  coreScale = 0.9,
  coreOffset = [0, 0, -0.09],
  glassColor = '#5ab6ff',
  transmission = 0.98,
  thickness = 0.42,
  ior = 1.25,
  chromaticAberration = 0.025,
  ...shapeProps
}) {
  return (
    <group position={position}>
      <Plane rotation={rotation} {...shapeProps} />
      <mesh rotation={rotation} scale={coreScale} position={coreOffset}>
        <planeGeometry args={[2.2, 1.6, 24, 18]} />
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
