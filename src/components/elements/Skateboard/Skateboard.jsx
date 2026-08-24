import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function Skateboard(props) {
  const { nodes, materials } = useGLTF(modelFile('skateboard.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.trucks_kingpin_1_low_skatie_0.geometry}
        material={materials.skatie}
        position={[0.399, 25.483, 0]}
        rotation={[Math.PI, 0, 0]}
        scale={0.32}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.trucks_kingpin_2_low_skatie_0.geometry}
        material={materials.skatie}
        position={[0.369, 25.483, 0]}
        rotation={[0, 0, Math.PI]}
        scale={0.32}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.trucks_nut_1_low_skatie_0.geometry}
        material={materials.skatie}
        position={[0.399, 25.483, 0]}
        rotation={[Math.PI, 0, 0]}
        scale={0.32}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.trucks_nut_2_low_skatie_0.geometry}
        material={materials.skatie}
        position={[0.369, 25.483, 0]}
        rotation={[0, 0, Math.PI]}
        scale={0.32}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.trucks_pivotcup_1_low_skatie_0.geometry}
        material={materials.skatie}
        position={[0.399, 25.483, 0]}
        rotation={[Math.PI, 0, 0]}
        scale={0.32}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.trucks_pivotcup_2_low_skatie_0.geometry}
        material={materials.skatie}
        position={[0.369, 25.483, 0]}
        rotation={[0, 0, Math.PI]}
        scale={0.32}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.trucks_baseplate_1_low_skatie_0.geometry}
        material={materials.skatie}
        position={[0.399, 25.483, 0]}
        rotation={[Math.PI, 0, 0]}
        scale={0.32}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.trucks_bushing_1_low_skatie_0.geometry}
        material={materials.skatie}
        position={[0.399, 25.483, 0]}
        rotation={[Math.PI, 0, 0]}
        scale={0.32}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.trucks_bushing_2_low_skatie_0.geometry}
        material={materials.skatie}
        position={[0.369, 25.483, 0]}
        rotation={[0, 0, Math.PI]}
        scale={0.32}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.trucks_hanger_1_low_skatie_0.geometry}
        material={materials.skatie}
        position={[0.399, 25.483, 0]}
        rotation={[Math.PI, 0, 0]}
        scale={0.32}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.wheel_screw_1_low_skatie_0.geometry}
        material={materials.skatie}
        position={[-1.709, -14.686, 0]}
        rotation={[0, 0, -0.721]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.wheel_screw_1_low_skatie_0_1.geometry}
        material={materials.skatie}
        position={[1.935, 3.402, 0]}
        rotation={[0, 0, 2.481]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.wheel_1_low_skatie_0.geometry}
        material={materials.skatie}
        position={[-1.709, -14.686, 0]}
        rotation={[0, 0, -0.721]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.wheel_1_low_skatie_0_1.geometry}
        material={materials.skatie}
        position={[1.935, 3.402, 0]}
        rotation={[0, 0, 2.481]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.trucks_baseplate_2_low_skatie_0.geometry}
        material={materials.skatie}
        position={[0.369, 25.483, 0]}
        rotation={[0, 0, Math.PI]}
        scale={0.32}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.trucks_hanger_2_low_skatie_0.geometry}
        material={materials.skatie}
        position={[0.369, 25.483, 0]}
        rotation={[0, 0, Math.PI]}
        scale={0.32}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.trucks_baseplate_screws_1_low_skatie_0.geometry}
        material={materials.skatie}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.trucks_baseplate_screws_2_low_skatie_0.geometry}
        material={materials.skatie}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.wheel_screw_2_low_skatie_0.geometry}
        material={materials.skatie}
        position={[-5.348, -19.728, 0]}
        rotation={[0, 0, -1.019]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.wheel_screw_2_low_skatie_0_1.geometry}
        material={materials.skatie}
        position={[16.617, 15.401, 0]}
        rotation={[0, 0, 1.542]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.wheel_2_low_skatie_0.geometry}
        material={materials.skatie}
        position={[-5.348, -19.728, 0]}
        rotation={[0, 0, -1.019]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.deck_low_skatie_0.geometry}
        material={materials.skatie}
        scale={[1, 1, 1.056]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.wheel_2_low_skatie_0_1.geometry}
        material={materials.skatie}
        position={[16.617, 15.401, 0]}
        rotation={[0, 0, 1.542]}
      />
    </group>
  );
}

useGLTF.preload(modelFile('skateboard.glb'));
