import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function AbandonedHouseInterior(props) {
  const { nodes, materials } = useGLTF(
    modelFile('abandoned_house_interior.glb')
  );
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_2.geometry}
        material={materials.material_0}
        position={[-9.235, 7.457, 28.844]}
        rotation={[-3.11, 0.001, 0.02]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_3.geometry}
        material={materials.material_0}
        position={[-9.235, 7.457, 28.844]}
        rotation={[-3.11, 0.001, 0.02]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_4.geometry}
        material={materials.material_0}
        position={[-9.235, 7.457, 28.844]}
        rotation={[-3.11, 0.001, 0.02]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_5.geometry}
        material={materials.material_0}
        position={[-9.235, 7.457, 28.844]}
        rotation={[-3.11, 0.001, 0.02]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_6.geometry}
        material={materials.material_0}
        position={[-9.235, 7.457, 28.844]}
        rotation={[-3.11, 0.001, 0.02]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_7.geometry}
        material={materials.material_0}
        position={[-9.235, 7.457, 28.844]}
        rotation={[-3.11, 0.001, 0.02]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_8.geometry}
        material={materials.material_0}
        position={[-9.235, 7.457, 28.844]}
        rotation={[-3.11, 0.001, 0.02]}
      />
    </group>
  );
}

useGLTF.preload(modelFile('abandoned_house_interior.glb'));
