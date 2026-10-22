import React, { useEffect, useMemo } from 'react';

import { createInstances } from '@react-three/drei';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';
import bakeInstancedGeometry from '@utils/instancedGeometry';

import {
  BEER_BOTTLE_1_MATERIAL_NAME,
  BEER_BOTTLE_1_MODEL_PATH,
  BEER_BOTTLE_1_TRANSFORM_CHAIN,
  BEER_BOTTLE_2_MATERIAL_NAME,
  BEER_BOTTLE_2_MODEL_PATH,
  BEER_BOTTLE_2_TRANSFORM_CHAIN,
  WHISKEY_BOTTLE_MATERIAL_NAME,
  WHISKEY_BOTTLE_MODEL_PATH,
  WHISKEY_BOTTLE_TRANSFORM_CHAIN,
} from './Bottles';

const [WhiskeyBottleInstancesRoot, WhiskeyBottleInstanceRoot] =
  createInstances();

const [BeerBottle1InstancesRoot, BeerBottle1InstanceRoot] = createInstances();

const [BeerBottle2InstancesRoot, BeerBottle2InstanceRoot] = createInstances();

export function WhiskeyBottleInstances({ children, material, ...props }) {
  const { nodes, materials } = useDracoGltf(
    modelFile(WHISKEY_BOTTLE_MODEL_PATH)
  );
  const baseGeometry = nodes.Object_114001.geometry;
  const sourceMaterial = materials[WHISKEY_BOTTLE_MATERIAL_NAME];
  const geometry = useMemo(
    () => bakeInstancedGeometry(baseGeometry, WHISKEY_BOTTLE_TRANSFORM_CHAIN),
    [baseGeometry]
  );
  const instanceMaterial = useMemo(
    () => material ?? sourceMaterial.clone(),
    [material, sourceMaterial]
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
    <WhiskeyBottleInstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </WhiskeyBottleInstancesRoot>
  );
}

export function WhiskeyBottleInstance(props) {
  return <WhiskeyBottleInstanceRoot {...props} />;
}

export function BeerBottle1Instances({ children, material, ...props }) {
  const { nodes, materials } = useDracoGltf(
    modelFile(BEER_BOTTLE_1_MODEL_PATH)
  );
  const baseGeometry = nodes.Object_138.geometry;
  const sourceMaterial = materials[BEER_BOTTLE_1_MATERIAL_NAME];
  const geometry = useMemo(
    () => bakeInstancedGeometry(baseGeometry, BEER_BOTTLE_1_TRANSFORM_CHAIN),
    [baseGeometry]
  );
  const instanceMaterial = useMemo(
    () => material ?? sourceMaterial.clone(),
    [material, sourceMaterial]
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
    <BeerBottle1InstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </BeerBottle1InstancesRoot>
  );
}

export function BeerBottle1Instance(props) {
  return <BeerBottle1InstanceRoot {...props} />;
}

export function BeerBottle2Instances({ children, material, ...props }) {
  const { nodes, materials } = useDracoGltf(
    modelFile(BEER_BOTTLE_2_MODEL_PATH)
  );
  const baseGeometry = nodes.Object_140.geometry;
  const sourceMaterial = materials[BEER_BOTTLE_2_MATERIAL_NAME];
  const geometry = useMemo(
    () => bakeInstancedGeometry(baseGeometry, BEER_BOTTLE_2_TRANSFORM_CHAIN),
    [baseGeometry]
  );
  const instanceMaterial = useMemo(
    () => material ?? sourceMaterial.clone(),
    [material, sourceMaterial]
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
    <BeerBottle2InstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </BeerBottle2InstancesRoot>
  );
}

export function BeerBottle2Instance(props) {
  return <BeerBottle2InstanceRoot {...props} />;
}
