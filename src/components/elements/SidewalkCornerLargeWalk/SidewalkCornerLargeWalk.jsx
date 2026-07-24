import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function SidewalkCornerLargeWalk(props) {
  const { nodes, materials } = useGLTF(
    modelFile('SidewalkCornerLargeWalk.glb')
  );
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.SidewalkCornerLargeWalkCurb_SidewalkMat_0.geometry}
        material={materials.SidewalkMat}
      />
    </group>
  );
}

useGLTF.preload(modelFile('SidewalkCornerLargeWalk.glb'));
