import React, { useEffect, useMemo } from 'react';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';
import bakeInstancedGeometry from '@utils/instancedGeometry';

const PERSIAN_RUG_MODEL_PATH = '/persian_rug.glb';
const PERSIAN_RUG_MODEL_FILE = modelFile(PERSIAN_RUG_MODEL_PATH);
const PERSIAN_RUG_MATERIAL_NAME = 'Old_Persian_carpet';
const PERSIAN_RUG_TRANSFORM_CHAIN = [{ position: [0, 0.106, 0], scale: 0.01 }];

function usePersianRugModel() {
  const { nodes, materials } = useDracoGltf(PERSIAN_RUG_MODEL_FILE);

  return {
    baseGeometry: nodes.Old_Persian_carpet_Old_Persian_carpet_0.geometry,
    sourceMaterial: materials[PERSIAN_RUG_MATERIAL_NAME],
  };
}

function usePersianRugGeometry(baseGeometry) {
  const geometry = useMemo(
    () => bakeInstancedGeometry(baseGeometry, PERSIAN_RUG_TRANSFORM_CHAIN),
    [baseGeometry]
  );

  useEffect(() => {
    return () => {
      geometry.dispose?.();
    };
  }, [geometry]);

  return geometry;
}

export default function PersianRug(props) {
  const { material, ...groupProps } = props;
  const { baseGeometry, sourceMaterial } = usePersianRugModel();
  const geometry = usePersianRugGeometry(baseGeometry);

  return (
    <group {...groupProps} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={geometry}
        material={material ?? sourceMaterial}
      />
    </group>
  );
}

useDracoGltf.preload(PERSIAN_RUG_MODEL_FILE);
