import React from 'react';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';

export const LOW_POLY_CASSETTE_TAPE_2_MODEL_PATH = '/lowPolyCassette2.glb';

export const LOW_POLY_CASSETTE_TAPE_2_NODE_NAME =
  'prop_cassette_tape_01002_audio_cassette_a_0';

export const LOW_POLY_CASSETTE_TAPE_2_MATERIAL_NAME = 'audio_cassette_a';

const LOW_POLY_CASSETTE_TAPE_2_MODEL_SCALE = 0.04;

export const LOW_POLY_CASSETTE_TAPE_2_TRANSFORM_CHAIN = [
  { scale: LOW_POLY_CASSETTE_TAPE_2_MODEL_SCALE },
];

export function LowPolyCassetteTape2(props) {
  const { nodes, materials } = useDracoGltf(
    modelFile(LOW_POLY_CASSETTE_TAPE_2_MODEL_PATH)
  );
  return (
    <group {...props} dispose={null}>
      <group scale={LOW_POLY_CASSETTE_TAPE_2_MODEL_SCALE}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes[LOW_POLY_CASSETTE_TAPE_2_NODE_NAME].geometry}
          material={materials[LOW_POLY_CASSETTE_TAPE_2_MATERIAL_NAME]}
        />
      </group>
    </group>
  );
}

useDracoGltf.preload(modelFile(LOW_POLY_CASSETTE_TAPE_2_MODEL_PATH));
