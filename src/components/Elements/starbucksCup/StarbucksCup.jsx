import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function StarbucksCup(props) {
  const { nodes, materials } = useGLTF(modelFile('/starbucks.glb'));

  return (
    <group {...props} dispose={null}>
      <group rotation={[-Math.PI / 2, 0, 0]} scale={0.05}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.starbuckscup2_0.geometry}
          material={materials.starbuckscup2_0_mat}
          position={[0, 0, 6.705]}
          rotation={[0, 0, -0.351]}
          scale={0.13}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('/starbucks.glb'));
