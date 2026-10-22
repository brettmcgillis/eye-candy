import React from 'react';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';

export function NewsPaper1(props) {
  const { nodes, materials } = useDracoGltf(modelFile('/newsPaper1.glb'));
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
  const { nodes, materials } = useDracoGltf(modelFile('/newsPaper2.glb'));
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
  const { nodes, materials } = useDracoGltf(modelFile('/newsPaper3.glb'));
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

useDracoGltf.preload(modelFile('/newsPaper1.glb'));
useDracoGltf.preload(modelFile('/newsPaper2.glb'));
useDracoGltf.preload(modelFile('/newsPaper3.glb'));
