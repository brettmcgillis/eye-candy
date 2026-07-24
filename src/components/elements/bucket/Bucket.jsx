import React, { useEffect, useMemo } from 'react';

import { createInstances, useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';
import bakeInstancedGeometry from '../../../utils/instancedGeometry';

const BUCKET_MODEL_PATH = '/bucket.glb';
const BUCKET_ROTATION = [Math.PI / 2, 0, 0];
const BUCKET_SCALE = 0.02;
const BUCKET_MATERIAL_NAME = 'sm30_072_PlasticBucket01A_A';
const BUCKET_TRANSFORM_CHAIN = [
  { rotation: BUCKET_ROTATION, scale: BUCKET_SCALE },
];

const [BucketInstancesRoot, BucketInstanceRoot] = createInstances();

export function BucketInstances({ children, material, ...props }) {
  const { nodes, materials } = useGLTF(modelFile(BUCKET_MODEL_PATH));
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

export function Bucket(props) {
  const { nodes, materials } = useGLTF(modelFile(BUCKET_MODEL_PATH));
  return (
    <group {...props} dispose={null}>
      <group scale={1.5}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_142.geometry}
          material={materials[BUCKET_MATERIAL_NAME]}
          rotation={BUCKET_ROTATION}
          scale={0.01}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile(BUCKET_MODEL_PATH));
