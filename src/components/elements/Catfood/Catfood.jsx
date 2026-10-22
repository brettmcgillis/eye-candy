import React, { useEffect, useMemo } from 'react';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';
import bakeInstancedGeometry from '@utils/instancedGeometry';

const CATFOOD_MODEL_PATH = '/catfood.glb';

const CATFOOD_MODEL_FILE = modelFile(CATFOOD_MODEL_PATH);

const CATFOOD_MATERIAL_NAME = 'material';

const CATFOOD_TRANSFORM_CHAIN = [{ rotation: [-Math.PI / 2, 0, 0] }];

export function useCatfoodModel() {
  const { nodes, materials } = useDracoGltf(CATFOOD_MODEL_FILE);

  return {
    baseGeometry: nodes.Catfood.geometry,
    sourceMaterial: materials[CATFOOD_MATERIAL_NAME],
  };
}

export function useCatfoodGeometry(baseGeometry) {
  const geometry = useMemo(
    () => bakeInstancedGeometry(baseGeometry, CATFOOD_TRANSFORM_CHAIN),
    [baseGeometry]
  );

  useEffect(() => {
    return () => {
      geometry.dispose?.();
    };
  }, [geometry]);

  return geometry;
}

export function Catfood(props) {
  const { baseGeometry, sourceMaterial } = useCatfoodModel();
  const geometry = useCatfoodGeometry(baseGeometry);

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

useDracoGltf.preload(CATFOOD_MODEL_FILE);

export default Catfood;
