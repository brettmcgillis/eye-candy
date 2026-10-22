import React, { useEffect, useMemo } from 'react';

import { createInstances } from '@react-three/drei';

import { useSnickersGeometry, useSnickersModel } from './Snickers';

const [SnickersInstancesRoot, SnickersInstanceRoot] = createInstances();

export function SnickersInstances({ children, material, ...props }) {
  const { baseGeometry, sourceMaterial } = useSnickersModel();
  const geometry = useSnickersGeometry(baseGeometry);
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
    <SnickersInstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </SnickersInstancesRoot>
  );
}

export function SnickersInstance(props) {
  return <SnickersInstanceRoot {...props} />;
}
