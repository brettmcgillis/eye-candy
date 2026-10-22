import React, { useEffect, useMemo } from 'react';

import { createInstances } from '@react-three/drei';

import { useHappyMealGeometry, useHappyMealModel } from './HappyMeal';

const [HappyMealInstancesRoot, HappyMealInstanceRoot] = createInstances();

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
