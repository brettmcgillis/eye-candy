import React, { useEffect, useMemo } from 'react';

import { createInstances, useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';
import bakeInstancedGeometry from '@utils/instancedGeometry';

const LOW_POLY_VHS_MODEL_PATH = '/lowPolyVhs.glb';
const LOW_POLY_VHS_NODE_NAME = 'vhs-tape_Material_#25_0';
const LOW_POLY_VHS_MATERIAL_NAME = 'VHSMaterial';
const LOW_POLY_VHS_GROUP_ROTATION = [Math.PI / 2, 0, 0];
const LOW_POLY_VHS_GROUP_SCALE = 0.035;
const LOW_POLY_VHS_MESH_ROTATION = [-Math.PI / 2, 0, 0];
const LOW_POLY_VHS_TRANSFORM_CHAIN = [
  {
    rotation: LOW_POLY_VHS_GROUP_ROTATION,
    scale: LOW_POLY_VHS_GROUP_SCALE,
  },
  {
    rotation: LOW_POLY_VHS_MESH_ROTATION,
  },
];

const [LowPolyVHSTapeInstancesRoot, LowPolyVHSTapeInstanceRoot] =
  createInstances();

export function LowPolyVHSTapeInstances({ children, material, ...props }) {
  const { nodes, materials } = useGLTF(modelFile(LOW_POLY_VHS_MODEL_PATH));
  const baseGeometry = nodes[LOW_POLY_VHS_NODE_NAME].geometry;
  const sourceMaterial = materials[LOW_POLY_VHS_MATERIAL_NAME];
  const geometry = useMemo(
    () => bakeInstancedGeometry(baseGeometry, LOW_POLY_VHS_TRANSFORM_CHAIN),
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
    <LowPolyVHSTapeInstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </LowPolyVHSTapeInstancesRoot>
  );
}

export function LowPolyVHSTapeInstance(props) {
  return <LowPolyVHSTapeInstanceRoot {...props} />;
}

export function LowPolyVHSTape(props) {
  const { nodes, materials } = useGLTF(modelFile(LOW_POLY_VHS_MODEL_PATH));

  return (
    <group {...props} dispose={null}>
      <group
        rotation={LOW_POLY_VHS_GROUP_ROTATION}
        scale={LOW_POLY_VHS_GROUP_SCALE}
      >
        <mesh
          castShadow
          receiveShadow
          geometry={nodes[LOW_POLY_VHS_NODE_NAME].geometry}
          material={materials[LOW_POLY_VHS_MATERIAL_NAME]}
          rotation={LOW_POLY_VHS_MESH_ROTATION}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile(LOW_POLY_VHS_MODEL_PATH));
