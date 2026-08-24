import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function ManholeCover(props) {
  const { nodes, materials } = useGLTF(modelFile('manholeCover.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Manhole_Manhole_shader_0.geometry}
        material={materials['Manhole_shader.003']}
        scale={0.01}
      />
    </group>
  );
}

useGLTF.preload(modelFile('manholeCover.glb'));
