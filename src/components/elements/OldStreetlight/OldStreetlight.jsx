import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function OldStreetlight(props) {
  const { nodes, materials } = useGLTF(modelFile('old_streetlight.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Streetlight_TEXTURE_0.geometry}
        material={materials.TEXTURE}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Streetlight_GLASS_0.geometry}
        material={materials.GLASS}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Base_BASE_0.geometry}
        material={materials.BASE}
      />
    </group>
  );
}

useGLTF.preload(modelFile('old_streetlight.glb'));
