import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function DoubleGulp(props) {
  const { nodes, materials } = useGLTF(modelFile('double_gulp.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_4.geometry}
        material={materials.PaletteMaterial001}
        scale={1.42}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_7.geometry}
        material={materials.label}
        scale={1.42}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_9.geometry}
        material={materials.PaletteMaterial002}
        position={[0, 8.515, 0]}
        scale={1.907}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_12.geometry}
        material={materials.PaletteMaterial003}
        scale={1.472}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_14.geometry}
        material={materials.PaletteMaterial004}
        position={[0, 6.857, 0]}
        rotation={[0, 0.705, 0]}
        scale={0.122}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_16.geometry}
        material={materials.PaletteMaterial005}
        position={[0, 6.857, 0]}
        rotation={[0, 0.705, 0]}
        scale={0.122}
      />
    </group>
  );
}

useGLTF.preload(modelFile('double_gulp.glb'));
