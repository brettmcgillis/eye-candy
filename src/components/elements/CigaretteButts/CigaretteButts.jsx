import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function CigaretteButts(props) {
  const { nodes, materials } = useGLTF(modelFile('/cigaretteButts.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Litter_1_Litter_1_0.geometry}
        material={materials.Litter_1}
      />
    </group>
  );
}

useGLTF.preload(modelFile('/cigaretteButts.glb'));
