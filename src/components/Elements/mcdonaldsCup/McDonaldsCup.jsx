import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function McDonaldsCup(props) {
  const { nodes, materials } = useGLTF(modelFile('/mcCup.glb'));
  return (
    <group {...props} dispose={null}>
      <group scale={0.01}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.cup.geometry}
          material={materials['Material.003']}
          position={[0, 263.293, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={100}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.lid.geometry}
          material={materials['Material.001']}
          position={[0, 516.935, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={100}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.straw.geometry}
          material={materials['Material.002']}
          position={[0, 501.832, -0.222]}
          rotation={[-1.701, 0, 0]}
          scale={[13.067, 13.067, 129.932]}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('/mcCup.glb'));
