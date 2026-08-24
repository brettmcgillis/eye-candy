import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function Sidewalk2(props) {
  const { nodes, materials } = useGLTF(modelFile('Sidewalk2.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.SidewalkCurb_Small_SidewalkMat_0.geometry}
        material={materials.SidewalkMat}
      />
    </group>
  );
}

useGLTF.preload(modelFile('Sidewalk2.glb'));
