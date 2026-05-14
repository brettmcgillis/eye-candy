import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function HappyMeal(props) {
  const { nodes, materials } = useGLTF(modelFile('/happyMeal.glb'));
  return (
    <group {...props} dispose={null}>
      <group scale={0.4}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_3.geometry}
          material={materials['Material.001']}
          position={[0, 1.774, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('/happyMeal.glb'));
