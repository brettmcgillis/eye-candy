import React from 'react';

import { MeshTransmissionMaterial } from '@react-three/drei';

import Sphere from './Sphere';

export default function DoubleSphere({
  position,
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
      <Sphere {...shapeProps} />
      <mesh scale={coreScale}>
        <sphereGeometry args={[0.75, 64, 64]} />
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
