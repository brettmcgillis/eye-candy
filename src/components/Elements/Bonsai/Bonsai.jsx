import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function Bonsai(props) {
  const { nodes, materials } = useGLTF(modelFile('bonsai.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.v176CherryTree03BonsaiShape_v176BonsaiSoil01_0.geometry}
        material={materials.v176BonsaiSoil01}
        scale={0.01}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.v176CherryTree03BonsaiShape_v176BonsaiPot01_0.geometry}
        material={materials.v176BonsaiPot01}
        scale={0.01}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.v176CherryTree03BonsaiShape_v176CherryBark01_0.geometry}
        material={materials.v176CherryBark01}
        scale={0.01}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.v176CherryTree03BonsaiShape_v176CherryBranch01_0.geometry
        }
        material={materials.v176CherryBranch01}
        scale={0.01}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={
          nodes.v176CherryTree03BonsaiShape_v176CherryFlowerStalk_0.geometry
        }
        material={materials.v176CherryFlowerStalk}
        scale={0.01}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.v176CherryTree03BonsaiShape_v176CherryBud_0.geometry}
        material={materials.v176CherryBud}
        scale={0.01}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.v176CherryTree03BonsaiShape_v176Tree_Knot_0.geometry}
        material={materials.v176Tree_Knot}
        scale={0.01}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.v176CherryTree03BonsaiShape_v176CherryFlower_0.geometry}
        material={materials.v176CherryFlower}
        scale={0.01}
      />
    </group>
  );
}

useGLTF.preload(modelFile('bonsai.glb'));
