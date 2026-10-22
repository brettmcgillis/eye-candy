import React from 'react';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';

export const LOW_POLY_FLOPPY_DISK_MODEL_PATH = '/lowPolyFloppy.glb';

export const LOW_POLY_FLOPPY_DISK_NODE_NAME = 'FloppyDisk_FloppyDisk_0';

export const LOW_POLY_FLOPPY_DISK_MATERIAL_NAME = 'FloppyDisk';

const LOW_POLY_FLOPPY_DISK_MODEL_SCALE = 0.03;

export const LOW_POLY_FLOPPY_DISK_TRANSFORM_CHAIN = [
  { scale: LOW_POLY_FLOPPY_DISK_MODEL_SCALE },
];

export function LowPolyFloppyDisk(props) {
  const { nodes, materials } = useDracoGltf(
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

useDracoGltf.preload(modelFile(LOW_POLY_FLOPPY_DISK_MODEL_PATH));
