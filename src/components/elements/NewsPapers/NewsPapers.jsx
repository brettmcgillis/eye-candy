import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export function NewsPaper1(props) {
  const { nodes, materials } = useGLTF(modelFile('/newsPaper1.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.News_3_Newspaper_0.geometry}
        material={materials.Newspaper}
      />
    </group>
  );
}

export function NewsPaper2(props) {
  const { nodes, materials } = useGLTF(modelFile('/newsPaper2.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.News_2_Newspaper_0.geometry}
        material={materials.Newspaper}
      />
    </group>
  );
}
export function NewsPaper3(props) {
  const { nodes, materials } = useGLTF(modelFile('/newsPaper3.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.News_1_Newspaper_0.geometry}
        material={materials.Newspaper}
      />
    </group>
  );
}

useGLTF.preload(modelFile('/newsPaper1.glb'));
useGLTF.preload(modelFile('/newsPaper2.glb'));
useGLTF.preload(modelFile('/newsPaper3.glb'));
