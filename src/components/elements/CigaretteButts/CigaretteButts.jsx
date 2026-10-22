import React from 'react';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';

export default function CigaretteButts(props) {
  const { nodes, materials } = useDracoGltf(modelFile('/cigaretteButts.glb'));
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

useDracoGltf.preload(modelFile('/cigaretteButts.glb'));
