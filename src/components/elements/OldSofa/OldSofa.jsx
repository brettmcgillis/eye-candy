import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function OldSofa(props) {
  const { nodes, materials } = useGLTF(modelFile('old_sofa.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Box001_7_0.geometry}
        material={materials.material}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.013}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Box001_5_0.geometry}
        material={materials.material_1}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.013}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Box001_6_0.geometry}
        material={materials.material_2}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.013}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Box001_4_0.geometry}
        material={materials.material_3}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.013}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Box001_3_0.geometry}
        material={materials.material_4}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.013}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Box001_1_0.geometry}
        material={materials.material_5}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.013}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Box001_2_0.geometry}
        material={materials.material_6}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.013}
      />
    </group>
  );
}

useGLTF.preload(modelFile('old_sofa.glb'));
