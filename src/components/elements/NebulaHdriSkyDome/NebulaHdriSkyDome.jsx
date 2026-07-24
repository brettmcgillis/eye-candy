import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function NebulaHdriSkyDome(props) {
  const { nodes, materials } = useGLTF(modelFile('nebula_hdri_skydome.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_4.geometry}
        material={materials['.003']}
      />
    </group>
  );
}

useGLTF.preload(modelFile('nebula_hdri_skydome.glb'));
