import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function TapeReel1(props) {
  const { nodes, materials } = useGLTF(modelFile('tapeReel1.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.TapeReel1.geometry}
        material={materials.Tape}
        scale={0.01}
      />
    </group>
  );
}

useGLTF.preload(modelFile('tapeReel1.glb'));
