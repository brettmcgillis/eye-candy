import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function QuinnsD8(props) {
  const { nodes, materials } = useGLTF(modelFile(`Quinns_D8.glb`));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Solid001.geometry}
        material={materials.d8_mat}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Solid001_1.geometry}
        material={materials.Material}
      />
    </group>
  );
}

useGLTF.preload(modelFile(`Quinns_D8.glb`));
