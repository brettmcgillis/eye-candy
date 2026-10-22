import React, { useEffect, useMemo } from 'react';

import { createInstances } from '@react-three/drei';

import { useCatfoodGeometry, useCatfoodModel } from './Catfood';

const [CatfoodInstancesRoot, CatfoodInstanceRoot] = createInstances();

export function CatfoodInstances({ children, material, ...props }) {
  const { baseGeometry, sourceMaterial } = useCatfoodModel();
  const geometry = useCatfoodGeometry(baseGeometry);
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
    <CatfoodInstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </CatfoodInstancesRoot>
  );
}

export function CatfoodInstance(props) {
  return <CatfoodInstanceRoot {...props} />;
}
