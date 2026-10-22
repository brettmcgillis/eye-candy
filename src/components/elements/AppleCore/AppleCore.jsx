import React from 'react';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';

export const APPLE_CORE_MODEL_PATH = '/apple_core.glb';

const APPLE_CORE_ROTATION = [-Math.PI / 2, 0, 0];

const APPLE_CORE_SCALE = 0.1;

export const APPLE_CORE_MATERIAL_NAME = 'AppleCore.001_mat';

export const APPLE_CORE_TRANSFORM_CHAIN = [
  { rotation: APPLE_CORE_ROTATION, scale: APPLE_CORE_SCALE },
];

export function AppleCore(props) {
  const { nodes, materials } = useDracoGltf(modelFile(APPLE_CORE_MODEL_PATH));

  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.AppleCore001.geometry}
        material={materials[APPLE_CORE_MATERIAL_NAME]}
        rotation={APPLE_CORE_ROTATION}
        scale={APPLE_CORE_SCALE}
      />
    </group>
  );
}

useDracoGltf.preload(modelFile(APPLE_CORE_MODEL_PATH));
