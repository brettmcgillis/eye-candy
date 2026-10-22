import React from 'react';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';

export const LOW_POLY_VHS_MODEL_PATH = '/lowPolyVhs.glb';

export const LOW_POLY_VHS_NODE_NAME = 'vhs-tape_Material_#25_0';

export const LOW_POLY_VHS_MATERIAL_NAME = 'VHSMaterial';

const LOW_POLY_VHS_GROUP_ROTATION = [Math.PI / 2, 0, 0];

const LOW_POLY_VHS_GROUP_SCALE = 0.035;

const LOW_POLY_VHS_MESH_ROTATION = [-Math.PI / 2, 0, 0];

export const LOW_POLY_VHS_TRANSFORM_CHAIN = [
  {
    rotation: LOW_POLY_VHS_GROUP_ROTATION,
    scale: LOW_POLY_VHS_GROUP_SCALE,
  },
  {
    rotation: LOW_POLY_VHS_MESH_ROTATION,
  },
];

export function LowPolyVHSTape(props) {
  const { nodes, materials } = useDracoGltf(modelFile(LOW_POLY_VHS_MODEL_PATH));

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

useDracoGltf.preload(modelFile(LOW_POLY_VHS_MODEL_PATH));
