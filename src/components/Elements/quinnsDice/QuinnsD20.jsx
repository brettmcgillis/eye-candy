import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function QuinnsD20(props) {
  const { nodes, materials } = useGLTF(modelFile(`Quinns_D20.glb`));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.d20_geo.geometry}
        material={materials.d20_mat}
      />
    </group>
  );
}

useGLTF.preload(modelFile(`Quinns_D20.glb`));
