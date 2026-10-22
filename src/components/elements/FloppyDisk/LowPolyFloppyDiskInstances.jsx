import React, { useEffect, useMemo } from 'react';

import { createInstances } from '@react-three/drei';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';
import bakeInstancedGeometry from '@utils/instancedGeometry';

import {
  LOW_POLY_FLOPPY_DISK_MATERIAL_NAME,
  LOW_POLY_FLOPPY_DISK_MODEL_PATH,
  LOW_POLY_FLOPPY_DISK_NODE_NAME,
  LOW_POLY_FLOPPY_DISK_TRANSFORM_CHAIN,
} from './LowPolyFloppyDisk';

const [LowPolyFloppyDiskInstancesRoot, LowPolyFloppyDiskInstanceRoot] =
  createInstances();

export function LowPolyFloppyDiskInstances({ children, material, ...props }) {
  const { nodes, materials } = useDracoGltf(
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
