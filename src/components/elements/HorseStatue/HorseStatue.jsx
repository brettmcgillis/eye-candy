import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function HorseStatue(props) {
  const { nodes, materials } = useGLTF(modelFile('horse_statue.glb'));
  return (
    <group {...props} dispose={null}>
      <group scale={10}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes['0'].geometry}
          material={materials.horse_statue}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('horse_statue.glb'));
