import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function HundredDollarBillStack(props) {
  const { nodes, materials } = useGLTF(modelFile('HundredDollarBillStack.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_2.geometry}
        material={materials.dollar}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.001}
      />
    </group>
  );
}

useGLTF.preload(modelFile('HundredDollarBillStack.glb'));
