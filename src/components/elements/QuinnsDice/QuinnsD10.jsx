import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function QuinnsD10(props) {
  const { nodes, materials } = useGLTF(modelFile(`Quinns_D10.glb`));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.d10_geo.geometry}
        material={materials['d10_mat.001']}
      />
    </group>
  );
}

useGLTF.preload(modelFile(`Quinns_D10.glb`));
