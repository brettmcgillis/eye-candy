import React from 'react';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';

export const LOW_POLY_CASSETTE_TAPE_3_MODEL_PATH = '/lowPolyCassette3.glb';

export const LOW_POLY_CASSETTE_TAPE_3_NODE_NAME =
  'prop_cassette_tape_01001_audio_cassette_b_0';

export const LOW_POLY_CASSETTE_TAPE_3_MATERIAL_NAME = 'audio_cassette_b';

const LOW_POLY_CASSETTE_TAPE_3_MODEL_SCALE = 0.04;

export const LOW_POLY_CASSETTE_TAPE_3_TRANSFORM_CHAIN = [
  { scale: LOW_POLY_CASSETTE_TAPE_3_MODEL_SCALE },
];

export function LowPolyCassetteTape3(props) {
  const { nodes, materials } = useDracoGltf(
    modelFile(LOW_POLY_CASSETTE_TAPE_3_MODEL_PATH)
  );
  return (
    <group {...props} dispose={null}>
      <group scale={LOW_POLY_CASSETTE_TAPE_3_MODEL_SCALE}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes[LOW_POLY_CASSETTE_TAPE_3_NODE_NAME].geometry}
          material={materials[LOW_POLY_CASSETTE_TAPE_3_MATERIAL_NAME]}
        />
      </group>
    </group>
  );
}

useDracoGltf.preload(modelFile(LOW_POLY_CASSETTE_TAPE_3_MODEL_PATH));
