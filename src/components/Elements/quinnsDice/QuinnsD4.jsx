import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function QuinnsD4(props) {
  const { nodes, materials } = useGLTF(modelFile(`Quinns_D4.glb`));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.d4_geo.geometry}
        material={materials.d4_num_tex}
      />
    </group>
  );
}

useGLTF.preload(modelFile(`Quinns_D4.glb`));
