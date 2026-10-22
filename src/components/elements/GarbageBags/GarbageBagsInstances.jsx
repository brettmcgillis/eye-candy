import React, { useEffect, useMemo } from 'react';

import { createInstances } from '@react-three/drei';

import * as THREE from 'three';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';
import bakeInstancedGeometry from '@utils/instancedGeometry';

import {
  GARBAGE_BAG_1_MODEL_PATH,
  GARBAGE_BAG_1_TRANSFORM_CHAIN,
  GARBAGE_BAG_MATERIAL_PROPS,
  GARBAGE_BAG_MODEL_PATH,
  GARBAGE_BAG_TRANSFORM_CHAIN,
} from './GarbageBags';

const [GarbageBagInstancesRoot, GarbageBagInstanceRoot] = createInstances();

const [GarbageBag1InstancesRoot, GarbageBag1InstanceRoot] = createInstances();

export function GarbageBagInstances({ children, material, ...props }) {
  const { nodes } = useDracoGltf(modelFile(GARBAGE_BAG_MODEL_PATH));
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
  const { nodes } = useDracoGltf(modelFile(GARBAGE_BAG_1_MODEL_PATH));
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
