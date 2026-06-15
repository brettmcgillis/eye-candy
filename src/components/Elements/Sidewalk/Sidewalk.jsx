import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function Sidewalk(props) {
  const { nodes, materials } = useGLTF(modelFile('Sidewalk.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.SidewalkCurb_Small1_SidewalkMat_0001.geometry}
        material={materials.SidewalkMat}
      />
    </group>
  );
}

useGLTF.preload(modelFile('Sidewalk.glb'));
