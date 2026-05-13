import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

function GarbageBagMaterial() {
  return (
    <meshPhysicalMaterial
      color="#050505"
      roughness={0.258}
      metalness={0}
      specularIntensity={1}
      ior={1.45}
    />
  );
}

export function GarbageBag(props) {
  const { nodes } = useGLTF(modelFile('/garbage_bag.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Obj_Bags_5_asset__0.geometry}
        scale={0.01}
      >
        <GarbageBagMaterial />
      </mesh>
    </group>
  );
}

export function GarbageBag1(props) {
  const { nodes } = useGLTF(modelFile('/garbage_bag_1.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Obj_Bags_4_asset__0.geometry}
        scale={0.01}
      >
        <GarbageBagMaterial />
      </mesh>
    </group>
  );
}

export function GarbageBags1(props) {
  const { nodes } = useGLTF(modelFile('/garbage_bags_1.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Obj_Bags_1_asset__0.geometry}
        rotation={[-0.006, -0.44, -0.023]}
        scale={0.01}
      >
        <GarbageBagMaterial />
      </mesh>
    </group>
  );
}

export function GarbageBags2(props) {
  const { nodes } = useGLTF(modelFile('/garbage_bags_2.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Obj_Bags_3_asset__0.geometry}
        scale={0.01}
      >
        <GarbageBagMaterial />
      </mesh>
    </group>
  );
}

export function GarbageBagsPile(props) {
  const { nodes } = useGLTF(modelFile('/garbage_bags_pile.glb'));
  return (
    <group {...props} dispose={null}>
      <group scale={0.01}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Obj_Bags_2_asset__0.geometry}
        >
          <GarbageBagMaterial />
        </mesh>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Obj_Bags_2_asset__0001.geometry}
        >
          <GarbageBagMaterial />
        </mesh>
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('/garbage_bag.glb'));
useGLTF.preload(modelFile('/garbage_bag_1.glb'));
useGLTF.preload(modelFile('/garbage_bags_1.glb'));
useGLTF.preload(modelFile('/garbage_bags_2.glb'));
useGLTF.preload(modelFile('/garbage_bags_pile.glb'));
