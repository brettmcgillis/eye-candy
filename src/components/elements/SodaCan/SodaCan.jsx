import React, { useEffect, useMemo } from 'react';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';
import bakeInstancedGeometry from '@utils/instancedGeometry';

const SODA_CAN_MODEL_PATH = '/soda_can.glb';

const SODA_CAN_MODEL_FILE = modelFile(SODA_CAN_MODEL_PATH);

const SODA_CAN_MATERIAL_NAME = 'Material.001';

const SODA_CAN_TRANSFORM_CHAIN = [
  {
    rotation: [-Math.PI / 2, 0, 0],
    scale: [2.327, 2.327, 3.227],
  },
];

export function useSodaCanModel() {
  const { nodes, materials } = useDracoGltf(SODA_CAN_MODEL_FILE);

  return {
    baseGeometry: nodes.Cylinder_0.geometry,
    sourceMaterial: materials[SODA_CAN_MATERIAL_NAME],
  };
}

export function useSodaCanGeometry(baseGeometry) {
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

useDracoGltf.preload(SODA_CAN_MODEL_FILE);

export default SodaCan;
