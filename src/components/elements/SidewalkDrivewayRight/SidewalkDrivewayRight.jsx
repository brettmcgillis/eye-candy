import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function SidewalkDrivewayRight(props) {
  const { nodes, materials } = useGLTF(modelFile('SidewalkDrivewayRight.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.SidewalkDrivewayRight_SidewalkMat_0.geometry}
        material={materials.SidewalkMat}
      />
    </group>
  );
}

useGLTF.preload(modelFile('SidewalkDrivewayRight.glb'));
