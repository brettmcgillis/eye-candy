import React, { useEffect, useMemo } from 'react';

import { createInstances, useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';
import bakeInstancedGeometry from '@utils/instancedGeometry';

const CATFOOD_MODEL_PATH = '/catfood.glb';
const CATFOOD_MODEL_FILE = modelFile(CATFOOD_MODEL_PATH);
const CATFOOD_MATERIAL_NAME = 'material';
const CATFOOD_TRANSFORM_CHAIN = [{ rotation: [-Math.PI / 2, 0, 0] }];

const [CatfoodInstancesRoot, CatfoodInstanceRoot] = createInstances();

function useCatfoodModel() {
  const { nodes, materials } = useGLTF(CATFOOD_MODEL_FILE);

  return {
    baseGeometry: nodes.Catfood.geometry,
    sourceMaterial: materials[CATFOOD_MATERIAL_NAME],
  };
}

function useCatfoodGeometry(baseGeometry) {
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

export function CatfoodInstances({ children, material, ...props }) {
  const { baseGeometry, sourceMaterial } = useCatfoodModel();
  const geometry = useCatfoodGeometry(baseGeometry);
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
    <CatfoodInstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </CatfoodInstancesRoot>
  );
}

export function CatfoodInstance(props) {
  return <CatfoodInstanceRoot {...props} />;
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

useGLTF.preload(CATFOOD_MODEL_FILE);

export default Catfood;
