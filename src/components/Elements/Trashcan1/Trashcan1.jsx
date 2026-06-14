import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function Trashcan1(props) {
  const { nodes, materials } = useGLTF(modelFile('trashcan1.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_12.geometry}
        material={materials.Standard_Urban_Trashcan_Corroding}
      />
    </group>
  );
}

useGLTF.preload(modelFile('trashcan1.glb'));
