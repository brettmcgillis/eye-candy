import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function QuinnsD12(props) {
  const { nodes, materials } = useGLTF(modelFile(`Quinns_D12.glb`));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.d12_geo.geometry}
        material={materials.d12_mat}
      />
    </group>
  );
}

useGLTF.preload(modelFile(`Quinns_D12.glb`));
