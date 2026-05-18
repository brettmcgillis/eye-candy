import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

const FEMUR_MODEL_PATH = modelFile('femur.glb');

export default function Femur(props) {
  const { nodes, materials } = useGLTF(FEMUR_MODEL_PATH);
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Femur.geometry}
        material={materials.material_0}
      />
    </group>
  );
}

export function Model(props) {
  return <Femur {...props} />;
}

useGLTF.preload(FEMUR_MODEL_PATH);
