import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function BigGulp(props) {
  const { nodes, materials } = useGLTF(modelFile('big_gulp.glb'));
  return (
    <group {...props} dispose={null}>
      <group scale={0.1}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes['Cup_02_-_Default_0'].geometry}
          material={materials['02_-_Default']}
          position={[0.404, 0, 0.404]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[0.908, 0.908, 1]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes['Cup_03_-_Default_0'].geometry}
          material={materials['03_-_Default']}
          position={[0.404, 0, 0.404]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[0.908, 0.908, 1]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes['Cup_01_-_Default_0'].geometry}
          material={materials['01_-_Default']}
          position={[0.404, 0, 0.404]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[0.908, 0.908, 1]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes['Cup_08_-_Default_0'].geometry}
          material={materials['08_-_Default']}
          position={[0.404, 0, 0.404]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[0.908, 0.908, 1]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes['Straw_07_-_Default_0'].geometry}
          material={materials['07_-_Default']}
          position={[-0.103, 0, 5.468]}
          rotation={[-1.396, 0.086, -0.015]}
          scale={[0.26, 0.26, 3.905]}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('big_gulp.glb'));
