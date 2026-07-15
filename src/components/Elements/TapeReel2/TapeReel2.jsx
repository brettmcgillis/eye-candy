import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function TapeReel2(props) {
  const { nodes, materials } = useGLTF(modelFile('tapeReel2.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.TapeReel2.geometry}
        material={materials.Tape}
        scale={0.01}
      />
    </group>
  );
}

useGLTF.preload(modelFile('tapeReel2.glb'));
