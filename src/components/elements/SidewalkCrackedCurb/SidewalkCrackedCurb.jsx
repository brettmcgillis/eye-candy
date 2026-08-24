import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function SidewalkCrackedCurb(props) {
  const { nodes, materials } = useGLTF(modelFile('SidewalkCrackedCurb.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.SidewalkCracked_SidewalkMat_0.geometry}
        material={materials.SidewalkMat}
      />
    </group>
  );
}

useGLTF.preload(modelFile('SidewalkCrackedCurb.glb'));
