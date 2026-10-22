import React, { useEffect, useMemo } from 'react';

import { createInstances } from '@react-three/drei';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';
import bakeInstancedGeometry from '@utils/instancedGeometry';

import {
  LOW_POLY_CASSETTE_TAPE_3_MATERIAL_NAME,
  LOW_POLY_CASSETTE_TAPE_3_MODEL_PATH,
  LOW_POLY_CASSETTE_TAPE_3_NODE_NAME,
  LOW_POLY_CASSETTE_TAPE_3_TRANSFORM_CHAIN,
} from './LowPolyCassetteTape3';

const [LowPolyCassetteTape3InstancesRoot, LowPolyCassetteTape3InstanceRoot] =
  createInstances();

export function LowPolyCassetteTape3Instances({
  children,
  material,
  ...props
}) {
  const { nodes, materials } = useDracoGltf(
    modelFile(LOW_POLY_CASSETTE_TAPE_3_MODEL_PATH)
  );
  const baseGeometry = nodes[LOW_POLY_CASSETTE_TAPE_3_NODE_NAME].geometry;
  const sourceMaterial = materials[LOW_POLY_CASSETTE_TAPE_3_MATERIAL_NAME];
  const geometry = useMemo(
    () =>
      bakeInstancedGeometry(
        baseGeometry,
        LOW_POLY_CASSETTE_TAPE_3_TRANSFORM_CHAIN
      ),
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
    <LowPolyCassetteTape3InstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </LowPolyCassetteTape3InstancesRoot>
  );
}

export function LowPolyCassetteTape3Instance(props) {
  return <LowPolyCassetteTape3InstanceRoot {...props} />;
}
