import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function AppleCore(props) {
  const { nodes, materials } = useGLTF(modelFile('/apple_core.glb'));
  return (
    <group {...props} dispose={null}>
      <group scale={0.01}>
        <group
          position={[-1639.82, 0, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={343.06}
        >
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Icosphere_Material006_0.geometry}
            material={materials['Material.006']}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Icosphere_Material003_0.geometry}
            material={materials['Material.003']}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Icosphere_Material004_0.geometry}
            material={materials['Material.004']}
          />
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Icosphere_Material005_0.geometry}
            material={materials['Material.005']}
          />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('/apple_core.glb'));
