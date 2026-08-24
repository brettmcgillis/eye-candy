import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function SidewalkBroken(props) {
  const { nodes, materials } = useGLTF(modelFile('SidewalkBroken.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.BrokenCurb_SidewalkMat_0.geometry}
        material={materials.SidewalkMat}
      />
    </group>
  );
}

useGLTF.preload(modelFile('SidewalkBroken.glb'));
