import React, { useEffect, useMemo } from 'react';

import { createInstances, useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';
import bakeInstancedGeometry from '../../../utils/instancedGeometry';

const APPLE_CORE_MODEL_PATH = '/apple_core.glb';
const APPLE_CORE_ROTATION = [-Math.PI / 2, 0, 0];
const APPLE_CORE_SCALE = 0.1;
const APPLE_CORE_MATERIAL_NAME = 'AppleCore.001_mat';
const APPLE_CORE_TRANSFORM_CHAIN = [
  { rotation: APPLE_CORE_ROTATION, scale: APPLE_CORE_SCALE },
];

const [AppleCoreInstancesRoot, AppleCoreInstanceRoot] = createInstances();

export function AppleCoreInstances({ children, material, ...props }) {
  const { nodes, materials } = useGLTF(modelFile(APPLE_CORE_MODEL_PATH));
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

export function AppleCore(props) {
  const { nodes, materials } = useGLTF(modelFile(APPLE_CORE_MODEL_PATH));

  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.AppleCore001.geometry}
        material={materials[APPLE_CORE_MATERIAL_NAME]}
        rotation={APPLE_CORE_ROTATION}
        scale={APPLE_CORE_SCALE}
      />
    </group>
  );
}

useGLTF.preload(modelFile(APPLE_CORE_MODEL_PATH));
