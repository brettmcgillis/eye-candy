import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function SidewalkCornerSmallWalk(props) {
  const { nodes, materials } = useGLTF(
    modelFile('SidewalkCornerSmallWalk.glb')
  );
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.SidewalkCurb_Small5_SidewalkMat_0.geometry}
        material={materials.SidewalkMat}
      />
    </group>
  );
}

useGLTF.preload(modelFile('SidewalkCornerSmallWalk.glb'));
