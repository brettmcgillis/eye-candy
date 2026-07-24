import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function OneHundredDollarBill(props) {
  const { nodes, materials } = useGLTF(modelFile('OneHundredDollarBill.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_2.geometry}
        material={materials.Material}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={48.373}
      />
    </group>
  );
}

useGLTF.preload(modelFile('OneHundredDollarBill.glb'));
