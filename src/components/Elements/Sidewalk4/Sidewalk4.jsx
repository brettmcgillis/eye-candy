import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function Sidewalk4(props) {
  const { nodes, materials } = useGLTF(modelFile('Sidewalk4.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.SidewalkCurb_Small_SidewalkMat_0002.geometry}
        material={materials.SidewalkMat}
      />
    </group>
  );
}

useGLTF.preload(modelFile('Sidewalk4.glb'));
