import React from 'react';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';

export const LOW_POLY_CASSETTE_TAPE_1_MODEL_PATH = '/lowPolyCassette1.glb';

export const LOW_POLY_CASSETTE_TAPE_1_NODE_NAME =
  'prop_cassette_tape_01003_audio_cassette_c_0';

export const LOW_POLY_CASSETTE_TAPE_1_MATERIAL_NAME = 'audio_cassette_c';

const LOW_POLY_CASSETTE_TAPE_1_MODEL_SCALE = 0.04;

export const LOW_POLY_CASSETTE_TAPE_1_TRANSFORM_CHAIN = [
  { scale: LOW_POLY_CASSETTE_TAPE_1_MODEL_SCALE },
];

export function LowPolyCassetteTape1(props) {
  const { nodes, materials } = useDracoGltf(
    modelFile(LOW_POLY_CASSETTE_TAPE_1_MODEL_PATH)
  );
  return (
    <group {...props} dispose={null}>
      <group scale={LOW_POLY_CASSETTE_TAPE_1_MODEL_SCALE}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes[LOW_POLY_CASSETTE_TAPE_1_NODE_NAME].geometry}
          material={materials[LOW_POLY_CASSETTE_TAPE_1_MATERIAL_NAME]}
        />
      </group>
    </group>
  );
}

useDracoGltf.preload(modelFile(LOW_POLY_CASSETTE_TAPE_1_MODEL_PATH));
