import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function RowBoat(props) {
  const { nodes, materials } = useGLTF(modelFile('/rowboat.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        name="front_bench_mesh"
        castShadow
        receiveShadow
        geometry={nodes.front_bench_mesh.geometry}
        material={materials.rowboat_2}
      />
      <mesh
        name="horizontal_support_strips_mesh"
        castShadow
        receiveShadow
        geometry={nodes.horizontal_support_strips_mesh.geometry}
        material={materials.rowboat_1}
      />
      <mesh
        name="hull_mesh"
        castShadow
        receiveShadow
        geometry={nodes.hull_mesh.geometry}
        material={materials.rowboat_1}
      />
      <mesh
        name="left_oar_mesh"
        castShadow
        receiveShadow
        geometry={nodes.left_oar_mesh.geometry}
        material={materials.rowboat_2}
      />
      <mesh
        name="left_oar_lock_mesh"
        castShadow
        receiveShadow
        geometry={nodes.left_oar_lock_mesh.geometry}
        material={materials.rowboat_2}
      />
      <mesh
        name="middle_bench_mesh"
        castShadow
        receiveShadow
        geometry={nodes.middle_bench_mesh.geometry}
        material={materials.rowboat_2}
      />
      <mesh
        name="rear_bench_mesh"
        castShadow
        receiveShadow
        geometry={nodes.rear_bench_mesh.geometry}
        material={materials.rowboat_2}
      />
      <mesh
        name="right_oar_mesh"
        castShadow
        receiveShadow
        geometry={nodes.right_oar_mesh.geometry}
        material={materials.rowboat_2}
      />
      <mesh
        name="right_oar_lock_mesh"
        castShadow
        receiveShadow
        geometry={nodes.right_oar_lock_mesh.geometry}
        material={materials.rowboat_2}
      />
      <mesh
        name="support_strips_mesh"
        castShadow
        receiveShadow
        geometry={nodes.support_strips_mesh.geometry}
        material={materials.rowboat_1}
      />
      <mesh
        name="upper_edge_mesh"
        castShadow
        receiveShadow
        geometry={nodes.upper_edge_mesh.geometry}
        material={materials.rowboat_2}
      />
    </group>
  );
}

useGLTF.preload(modelFile('/rowboat.glb'));
