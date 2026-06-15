import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function SidewalkDrivewayMiddle(props) {
  const { nodes, materials } = useGLTF(modelFile('SidewalkDrivewayMiddle.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.DrivewayMid1_SidewalkMat_0.geometry}
        material={materials.SidewalkMat}
      />
    </group>
  );
}

useGLTF.preload(modelFile('SidewalkDrivewayMiddle.glb'));
