import React from 'react';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';

export const GARBAGE_BAG_MATERIAL_PROPS = {
  color: '#050505',
  roughness: 0.258,
  metalness: 0,
  specularIntensity: 1,
  ior: 1.45,
};

export const GARBAGE_BAG_MODEL_PATH = '/garbage_bag.glb';

export const GARBAGE_BAG_1_MODEL_PATH = '/garbage_bag_1.glb';

export const GARBAGE_BAG_TRANSFORM_CHAIN = [{ scale: 0.01 }];

export const GARBAGE_BAG_1_TRANSFORM_CHAIN = [{ scale: 0.01 }];

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
  const { nodes } = useDracoGltf(modelFile(GARBAGE_BAG_MODEL_PATH));
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
  const { nodes } = useDracoGltf(modelFile(GARBAGE_BAG_1_MODEL_PATH));
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
  const { nodes } = useDracoGltf(modelFile('/garbage_bags_1.glb'));
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
  const { nodes } = useDracoGltf(modelFile('/garbage_bags_2.glb'));
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
  const { nodes } = useDracoGltf(modelFile('/garbage_bags_pile.glb'));
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

useDracoGltf.preload(modelFile(GARBAGE_BAG_MODEL_PATH));

useDracoGltf.preload(modelFile(GARBAGE_BAG_1_MODEL_PATH));

useDracoGltf.preload(modelFile('/garbage_bags_1.glb'));

useDracoGltf.preload(modelFile('/garbage_bags_2.glb'));

useDracoGltf.preload(modelFile('/garbage_bags_pile.glb'));
