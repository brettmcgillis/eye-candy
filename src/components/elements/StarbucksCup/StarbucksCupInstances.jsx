import React, { useEffect, useMemo } from 'react';

import { createInstances } from '@react-three/drei';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';
import bakeInstancedGeometry from '@utils/instancedGeometry';

import {
  STARBUCKS_MODEL_PATH,
  STARBUCKS_TRANSFORM_CHAIN,
} from './StarbucksCup';

const [StarbucksCupInstancesRoot, StarbucksCupInstanceRoot] = createInstances();

export function StarbucksCupInstances({ children, material, ...props }) {
  const { nodes, materials } = useDracoGltf(modelFile(STARBUCKS_MODEL_PATH));
  const baseGeometry = nodes.starbuckscup2_0.geometry;
  const sourceMaterial = materials.starbuckscup2_0_mat;
  const geometry = useMemo(
    () => bakeInstancedGeometry(baseGeometry, STARBUCKS_TRANSFORM_CHAIN),
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
    <StarbucksCupInstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </StarbucksCupInstancesRoot>
  );
}

export function StarbucksCupInstance(props) {
  return <StarbucksCupInstanceRoot {...props} />;
}
