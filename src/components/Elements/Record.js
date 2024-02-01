import React from 'react';

import { useGLTF } from '@react-three/drei';

import record from 'models/Record.glb';

export default function Record({ ...props }) {
  const { nodes, materials } = useGLTF(record);
  return (
    <group {...props} dispose={null}>
      <group rotation={[-0.824, 0, 0]}>
        <group rotation={[Math.PI / 2, 0, 0]}>
          <mesh
            castShadow
            receiveShadow
            geometry={nodes['REC33#RECTextures'].geometry}
            material={materials.RECTextures}
            rotation={[-Math.PI / 2, 0, 0]}
          />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload('/Record.glb');
