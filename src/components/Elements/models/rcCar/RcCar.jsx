import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../../utils/appUtils';

export default function RcCar(props) {
  const { nodes, materials } = useGLTF(modelFile('/rc_toy_story.glb'));
  return (
    <group {...props} dispose={null}>
      <group rotation={[-Math.PI / 2, 0, 0]} scale={0.257}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.BODY_0.geometry}
          material={materials['000000000']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.WHEEL_3_0.geometry}
          material={materials['000000000']}
          position={[-3.15, 3.25, 0.45]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.WHEEL_3_0_1.geometry}
          material={materials['000000000']}
          position={[3.15, 3.25, 0.45]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.WHEEL_3_0_2.geometry}
          material={materials['000000000']}
          position={[-3.25, -4.95, 0.45]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.WHEEL_3_0_3.geometry}
          material={materials['000000000']}
          position={[3.25, -4.95, 0.45]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.AERIAL_0.geometry}
          material={materials['000000000']}
          position={[2.4, -1.9, 7.35]}
          rotation={[-Math.PI, 0, -Math.PI]}
          scale={[1, 1, 17.5]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.AERIAL_T_0.geometry}
          material={materials['000000000']}
          position={[2.4, -1.9, 9.1]}
          rotation={[-Math.PI, 0, -Math.PI]}
          scale={[1, 1, 17.5]}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('/rc_toy_story.glb'));
