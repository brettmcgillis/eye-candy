import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function ScatteredCash(props) {
  const { nodes, materials } = useGLTF(modelFile('ScatteredCash.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.cash_scatter_Cash_Pile_A_0.geometry}
        material={materials.Cash_Pile_A}
        rotation={[-Math.PI / 2, 0, 0]}
      />
    </group>
  );
}

useGLTF.preload(modelFile('ScatteredCash.glb'));
