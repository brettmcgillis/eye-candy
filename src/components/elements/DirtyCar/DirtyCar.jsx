import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function DirtyCar(props) {
  const { nodes, materials } = useGLTF(modelFile('dirty_car.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Material.geometry}
        material={materials['Scene_-_Root']}
      />
    </group>
  );
}

useGLTF.preload(modelFile('dirty_car.glb'));
