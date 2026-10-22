import React, { useEffect, useMemo } from 'react';

import { createInstances } from '@react-three/drei';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';
import bakeInstancedGeometry from '@utils/instancedGeometry';

import {
  APPLE_CORE_MATERIAL_NAME,
  APPLE_CORE_MODEL_PATH,
  APPLE_CORE_TRANSFORM_CHAIN,
} from './AppleCore';

const [AppleCoreInstancesRoot, AppleCoreInstanceRoot] = createInstances();

export function AppleCoreInstances({ children, material, ...props }) {
  const { nodes, materials } = useDracoGltf(modelFile(APPLE_CORE_MODEL_PATH));
  const baseGeometry = nodes.AppleCore001.geometry;
  const sourceMaterial = materials[APPLE_CORE_MATERIAL_NAME];
  const geometry = useMemo(
    () => bakeInstancedGeometry(baseGeometry, APPLE_CORE_TRANSFORM_CHAIN),
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
    <AppleCoreInstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </AppleCoreInstancesRoot>
  );
}

export function AppleCoreInstance(props) {
  return <AppleCoreInstanceRoot {...props} />;
}
