import React, { useEffect, useMemo } from 'react';

import { createInstances } from '@react-three/drei';

import { useMcCupGeometry, useMcCupModel } from './McCup';

const [McCupInstancesRoot, McCupInstanceRoot] = createInstances();

export function McCupInstances({ children, material, ...props }) {
  const { baseGeometry, sourceMaterial } = useMcCupModel();
  const geometry = useMcCupGeometry(baseGeometry);
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
    <McCupInstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </McCupInstancesRoot>
  );
}

export function McCupInstance(props) {
  return <McCupInstanceRoot {...props} />;
}
