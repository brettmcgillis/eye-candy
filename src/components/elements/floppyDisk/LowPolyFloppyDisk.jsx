import React, { useEffect, useMemo } from 'react';

import { createInstances, useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';
import bakeInstancedGeometry from '../../../utils/instancedGeometry';

const LOW_POLY_FLOPPY_DISK_MODEL_PATH = '/lowPolyFloppy.glb';
const LOW_POLY_FLOPPY_DISK_NODE_NAME = 'FloppyDisk_FloppyDisk_0';
const LOW_POLY_FLOPPY_DISK_MATERIAL_NAME = 'FloppyDisk';
const LOW_POLY_FLOPPY_DISK_MODEL_SCALE = 0.03;
const LOW_POLY_FLOPPY_DISK_TRANSFORM_CHAIN = [
  { scale: LOW_POLY_FLOPPY_DISK_MODEL_SCALE },
];

const [LowPolyFloppyDiskInstancesRoot, LowPolyFloppyDiskInstanceRoot] =
  createInstances();

export function LowPolyFloppyDiskInstances({ children, material, ...props }) {
  const { nodes, materials } = useGLTF(
    modelFile(LOW_POLY_FLOPPY_DISK_MODEL_PATH)
  );
  const baseGeometry = nodes[LOW_POLY_FLOPPY_DISK_NODE_NAME].geometry;
  const sourceMaterial = materials[LOW_POLY_FLOPPY_DISK_MATERIAL_NAME];
  const geometry = useMemo(
    () =>
      bakeInstancedGeometry(baseGeometry, LOW_POLY_FLOPPY_DISK_TRANSFORM_CHAIN),
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
    <LowPolyFloppyDiskInstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </LowPolyFloppyDiskInstancesRoot>
  );
}

export function LowPolyFloppyDiskInstance(props) {
  return <LowPolyFloppyDiskInstanceRoot {...props} />;
}

export function LowPolyFloppyDisk(props) {
  const { nodes, materials } = useGLTF(
    modelFile(LOW_POLY_FLOPPY_DISK_MODEL_PATH)
  );
  return (
    <group {...props} dispose={null}>
      <group scale={LOW_POLY_FLOPPY_DISK_MODEL_SCALE}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes[LOW_POLY_FLOPPY_DISK_NODE_NAME].geometry}
          material={materials[LOW_POLY_FLOPPY_DISK_MATERIAL_NAME]}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile(LOW_POLY_FLOPPY_DISK_MODEL_PATH));
