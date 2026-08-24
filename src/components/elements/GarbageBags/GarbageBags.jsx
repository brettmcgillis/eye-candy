import React, { useEffect, useMemo } from 'react';

import { createInstances, useGLTF } from '@react-three/drei';

import * as THREE from 'three';

import { modelFile } from '@utils/appUtils';
import bakeInstancedGeometry from '@utils/instancedGeometry';

const GARBAGE_BAG_MATERIAL_PROPS = {
  color: '#050505',
  roughness: 0.258,
  metalness: 0,
  specularIntensity: 1,
  ior: 1.45,
};

const GARBAGE_BAG_MODEL_PATH = '/garbage_bag.glb';
const GARBAGE_BAG_1_MODEL_PATH = '/garbage_bag_1.glb';
const GARBAGE_BAG_TRANSFORM_CHAIN = [{ scale: 0.01 }];
const GARBAGE_BAG_1_TRANSFORM_CHAIN = [{ scale: 0.01 }];

const [GarbageBagInstancesRoot, GarbageBagInstanceRoot] = createInstances();
const [GarbageBag1InstancesRoot, GarbageBag1InstanceRoot] = createInstances();

export function GarbageBagInstances({ children, material, ...props }) {
  const { nodes } = useGLTF(modelFile(GARBAGE_BAG_MODEL_PATH));
  const baseGeometry = nodes.Obj_Bags_5_asset__0.geometry;
  const geometry = useMemo(
    () => bakeInstancedGeometry(baseGeometry, GARBAGE_BAG_TRANSFORM_CHAIN),
    [baseGeometry]
  );
  const instanceMaterial = useMemo(
    () =>
      material ?? new THREE.MeshPhysicalMaterial(GARBAGE_BAG_MATERIAL_PROPS),
    [material]
  );

  useEffect(() => {
    return () => {
      geometry.dispose?.();
    };
  }, [geometry]);

  useEffect(() => {
    if (material) {
      return undefined;
    }

    return () => {
      instanceMaterial.dispose?.();
    };
  }, [instanceMaterial, material]);

  return (
    <GarbageBagInstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </GarbageBagInstancesRoot>
  );
}

export function GarbageBagInstance(props) {
  return <GarbageBagInstanceRoot {...props} />;
}

export function GarbageBag1Instances({ children, material, ...props }) {
  const { nodes } = useGLTF(modelFile(GARBAGE_BAG_1_MODEL_PATH));
  const baseGeometry = nodes.Obj_Bags_4_asset__0.geometry;
  const geometry = useMemo(
    () => bakeInstancedGeometry(baseGeometry, GARBAGE_BAG_1_TRANSFORM_CHAIN),
    [baseGeometry]
  );
  const instanceMaterial = useMemo(
    () =>
      material ?? new THREE.MeshPhysicalMaterial(GARBAGE_BAG_MATERIAL_PROPS),
    [material]
  );

  useEffect(() => {
    return () => {
      geometry.dispose?.();
    };
  }, [geometry]);

  useEffect(() => {
    if (material) {
      return undefined;
    }

    return () => {
      instanceMaterial.dispose?.();
    };
  }, [instanceMaterial, material]);

  return (
    <GarbageBag1InstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </GarbageBag1InstancesRoot>
  );
}

export function GarbageBag1Instance(props) {
  return <GarbageBag1InstanceRoot {...props} />;
}

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
  const { nodes } = useGLTF(modelFile(GARBAGE_BAG_MODEL_PATH));
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
  const { nodes } = useGLTF(modelFile(GARBAGE_BAG_1_MODEL_PATH));
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

useGLTF.preload(modelFile(GARBAGE_BAG_MODEL_PATH));
useGLTF.preload(modelFile(GARBAGE_BAG_1_MODEL_PATH));
useGLTF.preload(modelFile('/garbage_bags_1.glb'));
useGLTF.preload(modelFile('/garbage_bags_2.glb'));
useGLTF.preload(modelFile('/garbage_bags_pile.glb'));
