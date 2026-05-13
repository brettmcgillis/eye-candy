import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export function CardboardBox1(props) {
  const { nodes, materials } = useGLTF(modelFile('/cardboardbox1.glb'));
  return (
    <group {...props} dispose={null} scale={0.01}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.cardboard_box_1.geometry}
        material={materials.zOther_Props_01_2}
      />
    </group>
  );
}

export function CardboardBox2(props) {
  const { nodes, materials } = useGLTF(modelFile('/cardboardbox2.glb'));
  return (
    <group {...props} dispose={null} scale={0.01}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.cardboard_box_2.geometry}
        material={materials.zOther_Props_01_2}
      />
    </group>
  );
}

export function CardboardBox3(props) {
  const { nodes, materials } = useGLTF(modelFile('/cardboardbox3.glb'));
  return (
    <group {...props} dispose={null} scale={0.01}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.cardboard_box_3.geometry}
        material={materials.zOther_Props_01_2}
      />
    </group>
  );
}

export function CardboardBox4(props) {
  const { nodes, materials } = useGLTF(modelFile('/cardboardBox4.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_122.geometry}
        material={materials.sm36_002_Cardboard01A_A_Mat}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.01}
      />
    </group>
  );
}

export function CardboardBox5(props) {
  const { nodes, materials } = useGLTF(modelFile('/cardboardBox5.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_124.geometry}
        material={materials.sm36_004_Cardboard03A_A_Mat}
        rotation={[Math.PI / 2, 0, -0.05]}
        scale={0.019}
      />
    </group>
  );
}

export function BeerCase1(props) {
  const { nodes, materials } = useGLTF(modelFile('/beerCase1.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_118.geometry}
        material={materials.sm32_143_BeerCase01A_A_Mat}
        rotation={[Math.PI / 2, 0, -0.016]}
        scale={0.01}
      />
    </group>
  );
}

export function BeerCase2(props) {
  const { nodes, materials } = useGLTF(modelFile('/beerCase2.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_116.geometry}
        material={materials.sm32_128_BeerCase01A_A_Mat}
        rotation={[Math.PI / 2, 0, -0.016]}
        scale={0.01}
      />
    </group>
  );
}

useGLTF.preload(modelFile('/cardboardbox1.glb'));
useGLTF.preload(modelFile('/cardboardbox2.glb'));
useGLTF.preload(modelFile('/cardboardbox3.glb'));
useGLTF.preload(modelFile('/cardboardbox4.glb'));
useGLTF.preload(modelFile('/cardboardbox5.glb'));
useGLTF.preload(modelFile('/beerCase1.glb'));
useGLTF.preload(modelFile('/beerCase2.glb'));
