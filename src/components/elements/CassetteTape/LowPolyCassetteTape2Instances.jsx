import React, { useEffect, useMemo } from 'react';

import { createInstances } from '@react-three/drei';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';
import bakeInstancedGeometry from '@utils/instancedGeometry';

import {
  LOW_POLY_CASSETTE_TAPE_2_MATERIAL_NAME,
  LOW_POLY_CASSETTE_TAPE_2_MODEL_PATH,
  LOW_POLY_CASSETTE_TAPE_2_NODE_NAME,
  LOW_POLY_CASSETTE_TAPE_2_TRANSFORM_CHAIN,
} from './LowPolyCassetteTape2';

const [LowPolyCassetteTape2InstancesRoot, LowPolyCassetteTape2InstanceRoot] =
  createInstances();

export function LowPolyCassetteTape2Instances({
  children,
  material,
  ...props
}) {
  const { nodes, materials } = useDracoGltf(
    modelFile(LOW_POLY_CASSETTE_TAPE_2_MODEL_PATH)
  );
  const baseGeometry = nodes[LOW_POLY_CASSETTE_TAPE_2_NODE_NAME].geometry;
  const sourceMaterial = materials[LOW_POLY_CASSETTE_TAPE_2_MATERIAL_NAME];
  const geometry = useMemo(
    () =>
      bakeInstancedGeometry(
        baseGeometry,
        LOW_POLY_CASSETTE_TAPE_2_TRANSFORM_CHAIN
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
    <LowPolyCassetteTape2InstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </LowPolyCassetteTape2InstancesRoot>
  );
}

export function LowPolyCassetteTape2Instance(props) {
  return <LowPolyCassetteTape2InstanceRoot {...props} />;
}
