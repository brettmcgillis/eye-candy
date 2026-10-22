import React, { useEffect, useMemo } from 'react';

import { createInstances } from '@react-three/drei';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';
import bakeInstancedGeometry from '@utils/instancedGeometry';

import {
  LOW_POLY_VHS_MATERIAL_NAME,
  LOW_POLY_VHS_MODEL_PATH,
  LOW_POLY_VHS_NODE_NAME,
  LOW_POLY_VHS_TRANSFORM_CHAIN,
} from './LowPolyVHSTape';

const [LowPolyVHSTapeInstancesRoot, LowPolyVHSTapeInstanceRoot] =
  createInstances();

export function LowPolyVHSTapeInstances({ children, material, ...props }) {
  const { nodes, materials } = useDracoGltf(modelFile(LOW_POLY_VHS_MODEL_PATH));
  const baseGeometry = nodes[LOW_POLY_VHS_NODE_NAME].geometry;
  const sourceMaterial = materials[LOW_POLY_VHS_MATERIAL_NAME];
  const geometry = useMemo(
    () => bakeInstancedGeometry(baseGeometry, LOW_POLY_VHS_TRANSFORM_CHAIN),
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
    <LowPolyVHSTapeInstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </LowPolyVHSTapeInstancesRoot>
  );
}

export function LowPolyVHSTapeInstance(props) {
  return <LowPolyVHSTapeInstanceRoot {...props} />;
}
