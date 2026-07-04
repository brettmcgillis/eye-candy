import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function PaperCrane(props) {
  const { nodes, materials } = useGLTF(modelFile('paper_crane.glb'));
  return (
    <group {...props} dispose={null}>
      <lineSegments
        geometry={nodes.Object_2.geometry}
        material={materials.PapelOrigami}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_3.geometry}
        material={materials.PapelOrigami}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_4.geometry}
        material={materials.Sombra}
        rotation={[-Math.PI / 2, 0, 0]}
      />
    </group>
  );
}

useGLTF.preload(modelFile('paper_crane.glb'));
