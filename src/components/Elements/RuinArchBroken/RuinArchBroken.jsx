import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function RuinArchBroken(props) {
  const { nodes, materials } = useGLTF(modelFile('ruin_arch_broken.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.mesh_1_arch3_arch3_1_0.geometry}
        material={materials.arch3_1}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.025}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.mesh_2_Sweep2_arch3_2_0.geometry}
        material={materials.arch3_2}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.025}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.mesh_3_Cut_Revolve3_arch3_3_0.geometry}
        material={materials.arch3_3}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.025}
      />
    </group>
  );
}

useGLTF.preload(modelFile('ruin_arch_broken.glb'));
