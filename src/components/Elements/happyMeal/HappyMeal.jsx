import React, { useEffect, useMemo } from 'react';

import { createInstances, useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';
import bakeInstancedGeometry from '../../../utils/instancedGeometry';

const HAPPY_MEAL_MODEL_PATH = '/happyMeal.glb';
const HAPPY_MEAL_MATERIAL_NAME = 'Material.001';
const HAPPY_MEAL_ROTATION = [-Math.PI / 2, 0, 0];
const HAPPY_MEAL_TRANSFORM_CHAIN = [
  { scale: 0.35 },
  { position: [0, 1.774, 0], rotation: HAPPY_MEAL_ROTATION },
];

const [HappyMealInstancesRoot, HappyMealInstanceRoot] = createInstances();

export function HappyMealInstances({ children, material, ...props }) {
  const { nodes, materials } = useGLTF(modelFile(HAPPY_MEAL_MODEL_PATH));
  const baseGeometry = nodes.Object_3.geometry;
  const sourceMaterial = materials[HAPPY_MEAL_MATERIAL_NAME];
  const geometry = useMemo(
    () => bakeInstancedGeometry(baseGeometry, HAPPY_MEAL_TRANSFORM_CHAIN),
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
  const { nodes, materials } = useGLTF(modelFile(HAPPY_MEAL_MODEL_PATH));
  return (
    <group {...props} dispose={null}>
      <group scale={0.35}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_3.geometry}
          material={materials[HAPPY_MEAL_MATERIAL_NAME]}
          position={[0, 1.774, 0]}
          rotation={HAPPY_MEAL_ROTATION}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile(HAPPY_MEAL_MODEL_PATH));
