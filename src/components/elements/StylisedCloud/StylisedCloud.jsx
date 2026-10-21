import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function StylisedCloud(props) {
  const { nodes, materials } = useGLTF(modelFile('stylised_cloud.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.ZBrush_defualt_group_standardSurface1_0.geometry}
        material={materials.standardSurface1}
        scale={0.01}
      />
    </group>
  );
}

useGLTF.preload(modelFile('stylised_cloud.glb'));
