import React from 'react';

import { useGLTF } from '@react-three/drei';

import record from 'models/Record.glb';

export default function Record({ ...props }) {
  const { nodes, materials } = useGLTF(record);
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['REC33#RECTextures'].geometry}
        material={materials.RECTextures}
      />
    </group>
  );
}

useGLTF.preload('/Record.glb');
