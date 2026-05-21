import React, { useEffect, useMemo } from 'react';

import { createInstances, useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';
import bakeInstancedGeometry from '../../../utils/instancedGeometry';

const HAPPY_MEAL_MODEL_PATH = '/happyMeal.glb';
const HAPPY_MEAL_MODEL_FILE = modelFile(HAPPY_MEAL_MODEL_PATH);
const HAPPY_MEAL_MATERIAL_NAME = 'Material.001';
const HAPPY_MEAL_ROTATION = [-Math.PI / 2, 0, 0];
const HAPPY_MEAL_TRANSFORM_CHAIN = [
  { scale: 0.3 },
  { position: [0, 1.774, 0], rotation: HAPPY_MEAL_ROTATION },
];

const [HappyMealInstancesRoot, HappyMealInstanceRoot] = createInstances();

function useHappyMealModel() {
  const { nodes, materials } = useGLTF(HAPPY_MEAL_MODEL_FILE);

  return {
    baseGeometry: nodes.Object_3.geometry,
    sourceMaterial: materials[HAPPY_MEAL_MATERIAL_NAME],
  };
}

function useHappyMealGeometry(baseGeometry) {
  const geometry = useMemo(
    () => bakeInstancedGeometry(baseGeometry, HAPPY_MEAL_TRANSFORM_CHAIN),
    [baseGeometry]
  );

  useEffect(() => {
    return () => {
      geometry.dispose?.();
    };
  }, [geometry]);

  return geometry;
}

export function HappyMealInstances({ children, material, ...props }) {
  const { baseGeometry, sourceMaterial } = useHappyMealModel();
  const geometry = useHappyMealGeometry(baseGeometry);
  const instanceMaterial = useMemo(
    () => material ?? sourceMaterial.clone(),
    [material, sourceMaterial]
  );

  useEffect(() => {
    if (material) {
      return undefined;
    }

    return () => {
      instanceMaterial.dispose?.();
    };
  }, [instanceMaterial, material]);

  return (
    <HappyMealInstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </HappyMealInstancesRoot>
  );
}

export function HappyMealInstance(props) {
  return <HappyMealInstanceRoot {...props} />;
}

export default function HappyMeal(props) {
  const { baseGeometry, sourceMaterial } = useHappyMealModel();
  const geometry = useHappyMealGeometry(baseGeometry);

  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={geometry}
        material={sourceMaterial}
      />
    </group>
  );
}

useGLTF.preload(HAPPY_MEAL_MODEL_FILE);
