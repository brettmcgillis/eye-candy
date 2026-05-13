import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function StarbucksCup({
  showLid = true,
  showCup = true,
  ...props
}) {
  const { nodes, materials } = useGLTF(modelFile('/starbucks_cup.glb'));
  return (
    <group {...props} dispose={null}>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {showCup && (
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_2.geometry}
            material={materials['Cup.000']}
          />
        )}
        {showLid && (
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_3.geometry}
            material={materials['Top.000']}
          />
        )}
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('/starbucks_cup.glb'));
