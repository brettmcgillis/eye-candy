import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function QuinnsD6(props) {
  const { nodes, materials } = useGLTF(modelFile(`Quinns_D6.glb`));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.d6_geo.geometry}
        material={materials.d6_mat}
      />
    </group>
  );
}

useGLTF.preload(modelFile(`Quinns_D6.glb`));
