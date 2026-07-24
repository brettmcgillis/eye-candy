import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function Sidewalk3(props) {
  const { nodes, materials } = useGLTF(modelFile('Sidewalk3.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.SidewalkCurb_Small_SidewalkMat_0001.geometry}
        material={materials.SidewalkMat}
      />
    </group>
  );
}

useGLTF.preload(modelFile('Sidewalk3.glb'));
