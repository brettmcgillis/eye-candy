import React, { useEffect, useMemo } from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';
import bakeInstancedGeometry from '@utils/instancedGeometry';

const PERSIAN_RUG_MODEL_PATH = '/persian_rug.glb';
const PERSIAN_RUG_MODEL_FILE = modelFile(PERSIAN_RUG_MODEL_PATH);
const PERSIAN_RUG_MATERIAL_NAME = 'Old_Persian_carpet';
const PERSIAN_RUG_TRANSFORM_CHAIN = [{ position: [0, 0.106, 0], scale: 0.01 }];

function usePersianRugModel() {
  const { nodes, materials } = useGLTF(PERSIAN_RUG_MODEL_FILE);

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
  const { baseGeometry, sourceMaterial } = usePersianRugModel();
  const geometry = usePersianRugGeometry(baseGeometry);

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

useGLTF.preload(PERSIAN_RUG_MODEL_FILE);
