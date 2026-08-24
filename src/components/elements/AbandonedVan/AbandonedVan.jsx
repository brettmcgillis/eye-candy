import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function AbandonedVan(props) {
  const { nodes, materials } = useGLTF(modelFile('abandoned_van.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['default001_Material_#105_0'].geometry}
        material={materials.Material_105}
        rotation={[-Math.PI / 2, 0, 0]}
      />
    </group>
  );
}

useGLTF.preload(modelFile('abandoned_van.glb'));
