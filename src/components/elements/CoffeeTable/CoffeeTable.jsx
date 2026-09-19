import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function CoffeeTable(props) {
  const { nodes, materials } = useGLTF(modelFile('coffee_table.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.defaultMaterial.geometry}
        material={materials.Material}
      />
    </group>
  );
}

useGLTF.preload(modelFile('coffee_table.glb'));
