import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function Factory({ showWindows = true, ...props }) {
  const { nodes, materials } = useGLTF(modelFile('factory.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.FACTORY_BackRight_Wall.geometry}
        material={materials['lambert1.001']}
        position={[-1.105, 0, -0.011]}
        rotation={[-Math.PI, 0, -Math.PI]}
        scale={0.01}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.FACTORY_FrontLeft_Wall.geometry}
        material={materials['lambert1.001']}
        scale={0.01}
      />
      {showWindows && (
        <>
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.FACTORY_BackRight_Windows.geometry}
            material={materials['lambert1.001']}
            position={[-1.105, 0, -0.011]}
            rotation={[-Math.PI, 0, -Math.PI]}
            scale={0.01}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.FACTORY_FrontLeft_Windows.geometry}
            material={materials['lambert1.001']}
            scale={0.01}
          />
        </>
      )}
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.FACTORY_Roof001.geometry}
        material={materials['lambert1.001']}
        position={[5.515, 0, 0.178]}
        scale={0.01}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.FACTORY_SmokeStack001.geometry}
        material={materials['lambert1.001']}
        position={[11.433, 1, -7.862]}
        rotation={[0, 0.384, 0]}
        scale={0.01}
      />
    </group>
  );
}

useGLTF.preload(modelFile('factory.glb'));
