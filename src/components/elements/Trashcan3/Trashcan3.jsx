import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function Trashcan3(props) {
  const { nodes, materials } = useGLTF(modelFile('trashcan3.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_6.geometry}
        material={materials.Standard_Urban_Trashcan_Metallic}
      />
    </group>
  );
}

useGLTF.preload(modelFile('trashcan3.glb'));
