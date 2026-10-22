import React from 'react';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';

export const STARBUCKS_MODEL_PATH = '/starbucks.glb';

const STARBUCKS_ROTATION = [-Math.PI / 2, 0, 0];

export const STARBUCKS_TRANSFORM_CHAIN = [
  { rotation: STARBUCKS_ROTATION, scale: 0.05 },
  { position: [0, 0, 6.705], rotation: [0, 0, -0.351], scale: 0.13 },
];

export function StarbucksCup(props) {
  const { nodes, materials } = useDracoGltf(modelFile(STARBUCKS_MODEL_PATH));

  return (
    <group {...props} dispose={null}>
      <group rotation={STARBUCKS_ROTATION} scale={0.05}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.starbuckscup2_0.geometry}
          material={materials.starbuckscup2_0_mat}
          position={[0, 0, 6.705]}
          rotation={[0, 0, -0.351]}
          scale={0.13}
        />
      </group>
    </group>
  );
}

useDracoGltf.preload(modelFile(STARBUCKS_MODEL_PATH));
