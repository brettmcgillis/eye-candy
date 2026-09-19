import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function TvStand(props) {
  const { nodes, materials } = useGLTF(modelFile('tv_stand.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.TVstand_TVStand_mat_0.geometry}
        material={materials.TVStand_mat}
        scale={0.01}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.proxy_Tvstand_proxy_0.geometry}
        material={materials.proxy}
        scale={0.01}
      />
    </group>
  );
}

useGLTF.preload(modelFile('tv_stand.glb'));
