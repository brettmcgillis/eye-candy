import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function PostApocalypticBuildings(props) {
  const { nodes, materials } = useGLTF(
    modelFile('post-apocalyptic_buildings.glb')
  );
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#1_inner_Metal_inner_0'].geometry}
        material={materials.Metal_inner}
        position={[0.007, 7.63, 27.609]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#1_outer_paint_B#1_0'].geometry}
        material={materials.paint_B1}
        position={[-0.01, 5.478, 27.792]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#1_outer_paint_B#1_0_1'].geometry}
        material={materials.paint_B1}
        position={[-0.01, 5.478, 27.792]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#1_outer_Glass_window_0'].geometry}
        material={materials.Glass_window}
        position={[-0.01, 5.478, 27.792]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#1_outer_concrete_inner_0'].geometry}
        material={materials.concrete_inner}
        position={[-0.01, 5.478, 27.792]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#1_outer_Metal_bar_0'].geometry}
        material={materials.Metal_bar}
        position={[-0.01, 5.478, 27.792]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#1_outer_Metal_bar_0_1'].geometry}
        material={materials.Metal_bar}
        position={[-0.01, 5.478, 27.792]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#1_outer_Metal_0'].geometry}
        material={materials.Metal}
        position={[-0.01, 5.478, 27.792]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#1_outer_Metal_0_1'].geometry}
        material={materials.Metal}
        position={[-0.01, 5.478, 27.792]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#2_inner_Metal_inner_0'].geometry}
        material={materials.Metal_inner}
        position={[-0.014, 6.811, 14.154]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#2_outer_paint_B#2_0'].geometry}
        material={materials.paint_B2}
        position={[0.014, 5.064, 14.005]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#2_outer_paint_B#2_0_1'].geometry}
        material={materials.paint_B2}
        position={[0.014, 5.064, 14.005]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#2_outer_Glass_window_0'].geometry}
        material={materials.Glass_window}
        position={[0.014, 5.064, 14.005]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#2_outer_concrete_inner_0'].geometry}
        material={materials.concrete_inner}
        position={[0.014, 5.064, 14.005]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#2_outer_Metal_bar_0'].geometry}
        material={materials.Metal_bar}
        position={[0.014, 5.064, 14.005]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#2_outer_Metal_0'].geometry}
        material={materials.Metal}
        position={[0.014, 5.064, 14.005]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#2_outer_Metal_0_1'].geometry}
        material={materials.Metal}
        position={[0.014, 5.064, 14.005]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#3_inner_Metal_inner_0'].geometry}
        material={materials.Metal_inner}
        position={[0.765, 5.703, 5.255]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#3_outer_paint_B#3_0'].geometry}
        material={materials.paint_B3}
        position={[0.862, 4.266, 5.279]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#3_outer_paint_B#3_0_1'].geometry}
        material={materials.paint_B3}
        position={[0.862, 4.266, 5.279]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#3_outer_concrete_inner_0'].geometry}
        material={materials.concrete_inner}
        position={[0.862, 4.266, 5.279]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#3_outer_Metal_bar_0'].geometry}
        material={materials.Metal_bar}
        position={[0.862, 4.266, 5.279]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#3_outer_Metal_0'].geometry}
        material={materials.Metal}
        position={[0.862, 4.266, 5.279]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#3_outer_Metal_0_1'].geometry}
        material={materials.Metal}
        position={[0.862, 4.266, 5.279]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#3_outer_Glass_window_0'].geometry}
        material={materials.Glass_window}
        position={[0.862, 4.266, 5.279]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#4_inner_Metal_inner_0'].geometry}
        material={materials.Metal_inner}
        position={[-0.015, 6.779, -4.436]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#4_outer_paint_B#4_0'].geometry}
        material={materials.paint_B4}
        position={[0.014, 6.305, -4.294]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#4_outer_paint_B#4_0_1'].geometry}
        material={materials.paint_B4}
        position={[0.014, 6.305, -4.294]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#4_outer_concrete_inner_0'].geometry}
        material={materials.concrete_inner}
        position={[0.014, 6.305, -4.294]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#4_outer_Metal_bar_0'].geometry}
        material={materials.Metal_bar}
        position={[0.014, 6.305, -4.294]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#4_outer_Metal_0'].geometry}
        material={materials.Metal}
        position={[0.014, 6.305, -4.294]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#4_outer_Glass_window_0'].geometry}
        material={materials.Glass_window}
        position={[0.014, 6.305, -4.294]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#5_inner_Metal_inner_0'].geometry}
        material={materials.Metal_inner}
        position={[-0.003, 8.898, -15.625]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#5_outer_paint_B#5_0'].geometry}
        material={materials.paint_B5}
        position={[-0.009, 6.521, -15.564]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#5_outer_paint_B#5_0_1'].geometry}
        material={materials.paint_B5}
        position={[-0.009, 6.521, -15.564]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#5_outer_concrete_inner_0'].geometry}
        material={materials.concrete_inner}
        position={[-0.009, 6.521, -15.564]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#5_outer_Metal_bar_0'].geometry}
        material={materials.Metal_bar}
        position={[-0.009, 6.521, -15.564]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#5_outer_Metal_0'].geometry}
        material={materials.Metal}
        position={[-0.009, 6.521, -15.564]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#5_outer_Metal_0_1'].geometry}
        material={materials.Metal}
        position={[-0.009, 6.521, -15.564]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#5_outer_Glass_window_0'].geometry}
        material={materials.Glass_window}
        position={[-0.009, 6.521, -15.564]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#6_inner_Metal_inner_0'].geometry}
        material={materials.Metal_inner}
        position={[0.102, 9.776, -26.135]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#6_outer_paint_B#6_0'].geometry}
        material={materials.paint_B6}
        position={[-0.101, 7.511, -25.904]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#6_outer_paint_B#6_0_1'].geometry}
        material={materials.paint_B6}
        position={[-0.101, 7.511, -25.904]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#6_outer_concrete_inner_0'].geometry}
        material={materials.concrete_inner}
        position={[-0.101, 7.511, -25.904]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#6_outer_Metal_bar_0'].geometry}
        material={materials.Metal_bar}
        position={[-0.101, 7.511, -25.904]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#6_outer_Metal_0'].geometry}
        material={materials.Metal}
        position={[-0.101, 7.511, -25.904]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#6_outer_Metal_0_1'].geometry}
        material={materials.Metal}
        position={[-0.101, 7.511, -25.904]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Building_#6_outer_Glass_window_0'].geometry}
        material={materials.Glass_window}
        position={[-0.101, 7.511, -25.904]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={8.02}
      />
    </group>
  );
}

useGLTF.preload(modelFile('post-apocalyptic_buildings.glb'));
