import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function StopSignWeathered(props) {
  const { nodes, materials } = useGLTF(modelFile('stop_sign_weathered.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.defaultMaterial.geometry}
        material={materials.m_stop_sign}
      />
    </group>
  );
}

useGLTF.preload(modelFile('stop_sign_weathered.glb'));
