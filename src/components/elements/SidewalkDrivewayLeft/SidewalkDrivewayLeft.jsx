import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function SidewalkDrivewayLeft(props) {
  const { nodes, materials } = useGLTF(modelFile('SidewalkDrivewayLeft.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.SidewalkDrivewayLeftCurb_SidewalkMat_0.geometry}
        material={materials.SidewalkMat}
      />
    </group>
  );
}

useGLTF.preload(modelFile('SidewalkDrivewayLeft.glb'));
