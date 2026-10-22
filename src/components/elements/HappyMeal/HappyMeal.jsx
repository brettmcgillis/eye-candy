import React, { useEffect, useMemo } from 'react';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';
import bakeInstancedGeometry from '@utils/instancedGeometry';

const HAPPY_MEAL_MODEL_PATH = '/happyMeal.glb';

const HAPPY_MEAL_MODEL_FILE = modelFile(HAPPY_MEAL_MODEL_PATH);

const HAPPY_MEAL_MATERIAL_NAME = 'Material.001';

const HAPPY_MEAL_ROTATION = [-Math.PI / 2, 0, 0];

const HAPPY_MEAL_TRANSFORM_CHAIN = [
  { scale: 0.3 },
  { position: [0, 1.774, 0], rotation: HAPPY_MEAL_ROTATION },
];

export function useHappyMealModel() {
  const { nodes, materials } = useDracoGltf(HAPPY_MEAL_MODEL_FILE);

  return {
    baseGeometry: nodes.Object_3.geometry,
    sourceMaterial: materials[HAPPY_MEAL_MATERIAL_NAME],
  };
}

export function useHappyMealGeometry(baseGeometry) {
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

export function HappyMeal(props) {
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

useDracoGltf.preload(HAPPY_MEAL_MODEL_FILE);
