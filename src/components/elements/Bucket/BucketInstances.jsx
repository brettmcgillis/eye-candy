import React, { useEffect, useMemo } from 'react';

import { createInstances } from '@react-three/drei';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';
import bakeInstancedGeometry from '@utils/instancedGeometry';

import {
  BUCKET_MATERIAL_NAME,
  BUCKET_MODEL_PATH,
  BUCKET_TRANSFORM_CHAIN,
} from './Bucket';

const [BucketInstancesRoot, BucketInstanceRoot] = createInstances();

export function BucketInstances({ children, material, ...props }) {
  const { nodes, materials } = useDracoGltf(modelFile(BUCKET_MODEL_PATH));
  const baseGeometry = nodes.Object_142.geometry;
  const sourceMaterial = materials[BUCKET_MATERIAL_NAME];
  const geometry = useMemo(
    () => bakeInstancedGeometry(baseGeometry, BUCKET_TRANSFORM_CHAIN),
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
    <BucketInstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </BucketInstancesRoot>
  );
}

export function BucketInstance(props) {
  return <BucketInstanceRoot {...props} />;
}
