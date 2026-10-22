import React, { useEffect, useMemo } from 'react';

import { createInstances } from '@react-three/drei';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';
import bakeInstancedGeometry from '@utils/instancedGeometry';

import {
  LOW_POLY_CASSETTE_TAPE_1_MATERIAL_NAME,
  LOW_POLY_CASSETTE_TAPE_1_MODEL_PATH,
  LOW_POLY_CASSETTE_TAPE_1_NODE_NAME,
  LOW_POLY_CASSETTE_TAPE_1_TRANSFORM_CHAIN,
} from './LowPolyCassetteTape1';

const [LowPolyCassetteTape1InstancesRoot, LowPolyCassetteTape1InstanceRoot] =
  createInstances();

export function LowPolyCassetteTape1Instances({
  children,
  material,
  ...props
}) {
  const { nodes, materials } = useDracoGltf(
    modelFile(LOW_POLY_CASSETTE_TAPE_1_MODEL_PATH)
  );
  const baseGeometry = nodes[LOW_POLY_CASSETTE_TAPE_1_NODE_NAME].geometry;
  const sourceMaterial = materials[LOW_POLY_CASSETTE_TAPE_1_MATERIAL_NAME];
  const geometry = useMemo(
    () =>
      bakeInstancedGeometry(
        baseGeometry,
        LOW_POLY_CASSETTE_TAPE_1_TRANSFORM_CHAIN
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
    <LowPolyCassetteTape1InstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </LowPolyCassetteTape1InstancesRoot>
  );
}

export function LowPolyCassetteTape1Instance(props) {
  return <LowPolyCassetteTape1InstanceRoot {...props} />;
}
