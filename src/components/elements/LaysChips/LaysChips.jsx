import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function LaysChips(props) {
  const { nodes, materials } = useGLTF(modelFile('laysChips.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Lays_-_Classic_Lays_-_Originals_0'].geometry}
        material={materials['Lays_-_Originals']}
        scale={0.03}
      />
    </group>
  );
}

useGLTF.preload(modelFile('laysChips.glb'));
