import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function QuinnsD8(props) {
  const { nodes, materials } = useGLTF(modelFile(`Quinns_D8.glb`));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.d8_geo.geometry}
        material={materials.d8_mat}
      />
    </group>
  );
}

useGLTF.preload(modelFile(`Quinns_D8.glb`));
