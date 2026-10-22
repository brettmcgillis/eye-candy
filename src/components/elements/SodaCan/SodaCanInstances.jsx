import React, { useEffect, useMemo } from 'react';

import { createInstances } from '@react-three/drei';

import { useSodaCanGeometry, useSodaCanModel } from './SodaCan';

const [SodaCanInstancesRoot, SodaCanInstanceRoot] = createInstances();

export function SodaCanInstances({ children, material, ...props }) {
  const { baseGeometry, sourceMaterial } = useSodaCanModel();
  const geometry = useSodaCanGeometry(baseGeometry);
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
    <SodaCanInstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </SodaCanInstancesRoot>
  );
}

export function SodaCanInstance(props) {
  return <SodaCanInstanceRoot {...props} />;
}
