import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function AppleCore(props) {
  const { nodes, materials } = useGLTF(modelFile('/apple_core.glb'));

  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.AppleCore001.geometry}
        material={materials['AppleCore.001_mat']}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.1}
      />
    </group>
  );
}

useGLTF.preload(modelFile('/apple_core.glb'));
