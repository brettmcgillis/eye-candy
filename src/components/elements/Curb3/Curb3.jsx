import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function Curb3(props) {
  const { nodes, materials } = useGLTF(modelFile('curb3.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Sidewwalk_Long1_SidewalkMat_0.geometry}
        material={materials.SidewalkMat}
      />
    </group>
  );
}

useGLTF.preload(modelFile('curb3.glb'));
