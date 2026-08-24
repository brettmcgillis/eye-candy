import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function RuinArch(props) {
  const { nodes, materials } = useGLTF(modelFile('ruin_arch.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.mesh_1_arch_arch_1_0.geometry}
        material={materials.arch_1}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.025}
      />
    </group>
  );
}

useGLTF.preload(modelFile('ruin_arch.glb'));
