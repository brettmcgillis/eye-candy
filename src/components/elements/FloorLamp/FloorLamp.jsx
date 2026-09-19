import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function FloorLamp(props) {
  const { nodes, materials } = useGLTF(modelFile('floor_lamp.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Lamp_Lamp_0.geometry}
        material={materials.Lamp}
        position={[0, -170.063, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={100}
      />
    </group>
  );
}

useGLTF.preload(modelFile('floor_lamp.glb'));
