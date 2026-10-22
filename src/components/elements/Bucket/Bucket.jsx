import React from 'react';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';

export const BUCKET_MODEL_PATH = '/bucket.glb';

const BUCKET_ROTATION = [Math.PI / 2, 0, 0];

const BUCKET_SCALE = 0.02;

export const BUCKET_MATERIAL_NAME = 'sm30_072_PlasticBucket01A_A';

export const BUCKET_TRANSFORM_CHAIN = [
  { rotation: BUCKET_ROTATION, scale: BUCKET_SCALE },
];

export function Bucket(props) {
  const { nodes, materials } = useDracoGltf(modelFile(BUCKET_MODEL_PATH));
  return (
    <group {...props} dispose={null}>
      <group scale={1.5}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_142.geometry}
          material={materials[BUCKET_MATERIAL_NAME]}
          rotation={BUCKET_ROTATION}
          scale={0.01}
        />
      </group>
    </group>
  );
}

useDracoGltf.preload(modelFile(BUCKET_MODEL_PATH));
