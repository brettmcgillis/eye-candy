import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function CinderBlock1(props) {
  const { nodes, materials } = useGLTF(modelFile('/cinderblock1.glb'));
  return (
    <group {...props} dispose={null}>
      <group scale={0.01} rotation={[Math.PI / 2, 0, 0]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.cinderblock1.geometry}
          material={materials.cinder_block_mat}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('/cinderblock1.glb'));
