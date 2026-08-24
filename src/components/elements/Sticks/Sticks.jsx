import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function Sticks(props) {
  const { nodes, materials } = useGLTF(modelFile('sticks.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.stick_1002_sticks_0.geometry}
        material={materials.sticks}
        position={[0.103, 0.027, -0.018]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.stick_2002_sticks_0.geometry}
        material={materials.sticks}
        position={[0.157, 0.015, -0.034]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.stick_3002_sticks_0.geometry}
        material={materials.sticks}
        position={[-0.133, 0.007, -0.046]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.stick_4002_sticks_0.geometry}
        material={materials.sticks}
        position={[0.268, 0.022, -0.09]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.stick_5002_sticks_0.geometry}
        material={materials.sticks}
        position={[0.272, 0.016, -0.068]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.stick_6002_sticks_0.geometry}
        material={materials.sticks}
        position={[-0.016, 0.012, 0.212]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.stick_7002_sticks_0.geometry}
        material={materials.sticks}
        position={[0.006, 0.014, -0.178]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.stick_8002_sticks_0.geometry}
        material={materials.sticks}
        position={[-0.105, 0.008, 0.109]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.stick_9002_sticks_0.geometry}
        material={materials.sticks}
        position={[-0.129, 0.022, 0.144]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
    </group>
  );
}

useGLTF.preload(modelFile('sticks.glb'));
