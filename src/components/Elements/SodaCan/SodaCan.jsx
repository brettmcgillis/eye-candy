import React, { useEffect, useMemo } from 'react';

import { createInstances, useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';
import bakeInstancedGeometry from '../../../utils/instancedGeometry';

const SODA_CAN_MODEL_PATH = '/soda_can.glb';
const SODA_CAN_MODEL_FILE = modelFile(SODA_CAN_MODEL_PATH);
const SODA_CAN_MATERIAL_NAME = 'Material.001';
const SODA_CAN_TRANSFORM_CHAIN = [
  {
    rotation: [-Math.PI / 2, 0, 0],
    scale: [2.327, 2.327, 3.227],
  },
];

const [SodaCanInstancesRoot, SodaCanInstanceRoot] = createInstances();

function useSodaCanModel() {
  const { nodes, materials } = useGLTF(SODA_CAN_MODEL_FILE);

  return {
    baseGeometry: nodes.Cylinder_0.geometry,
    sourceMaterial: materials[SODA_CAN_MATERIAL_NAME],
  };
}

function useSodaCanGeometry(baseGeometry) {
  const geometry = useMemo(
    () => bakeInstancedGeometry(baseGeometry, SODA_CAN_TRANSFORM_CHAIN),
    [baseGeometry]
  );

  useEffect(() => {
    return () => {
      geometry.dispose?.();
    };
  }, [geometry]);

  return geometry;
}

export function SodaCanInstances({ children, material, ...props }) {
  const { baseGeometry, sourceMaterial } = useSodaCanModel();
  const geometry = useSodaCanGeometry(baseGeometry);
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
    <SodaCanInstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </SodaCanInstancesRoot>
  );
}

export function SodaCanInstance(props) {
  return <SodaCanInstanceRoot {...props} />;
}

export function SodaCan(props) {
  const { baseGeometry, sourceMaterial } = useSodaCanModel();
  const geometry = useSodaCanGeometry(baseGeometry);

  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={geometry}
        material={sourceMaterial}
      />
    </group>
  );
}

useGLTF.preload(SODA_CAN_MODEL_FILE);

export default SodaCan;
