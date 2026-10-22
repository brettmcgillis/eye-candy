import React from 'react';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';

export const CARDBOARD_BOX_1_MODEL_PATH = '/cardboardbox1.glb';

export const CARDBOARD_BOX_1_TRANSFORM_CHAIN = [{ scale: 0.01 }];

export const CARDBOARD_BOX_2_MODEL_PATH = '/cardboardbox2.glb';

export const CARDBOARD_BOX_2_TRANSFORM_CHAIN = [{ scale: 0.01 }];

export const CARDBOARD_BOX_3_MODEL_PATH = '/cardboardbox3.glb';

export const CARDBOARD_BOX_3_TRANSFORM_CHAIN = [{ scale: 0.01 }];

export const CARDBOARD_BOX_4_MODEL_PATH = '/cardboardBox4.glb';

const CARDBOARD_BOX_4_ROTATION = [Math.PI / 2, 0, 0];

const CARDBOARD_BOX_4_SCALE = 0.01;

export const CARDBOARD_BOX_4_MATERIAL_NAME = 'sm36_002_Cardboard01A_A_Mat';

export const CARDBOARD_BOX_4_TRANSFORM_CHAIN = [
  { rotation: CARDBOARD_BOX_4_ROTATION, scale: CARDBOARD_BOX_4_SCALE },
];

export const CARDBOARD_BOX_5_MODEL_PATH = '/cardboardBox5.glb';

const CARDBOARD_BOX_5_ROTATION = [Math.PI / 2, 0, -0.05];

const CARDBOARD_BOX_5_SCALE = 0.019;

export const CARDBOARD_BOX_5_MATERIAL_NAME = 'sm36_004_Cardboard03A_A_Mat';

export const CARDBOARD_BOX_5_TRANSFORM_CHAIN = [
  { rotation: CARDBOARD_BOX_5_ROTATION, scale: CARDBOARD_BOX_5_SCALE },
];

export const BEER_CASE_1_MODEL_PATH = '/beerCase1.glb';

const BEER_CASE_1_ROTATION = [Math.PI / 2, 0, -0.016];

const BEER_CASE_1_SCALE = 0.02;

export const BEER_CASE_1_MATERIAL_NAME = 'sm32_143_BeerCase01A_A_Mat';

export const BEER_CASE_1_TRANSFORM_CHAIN = [
  { rotation: BEER_CASE_1_ROTATION, scale: BEER_CASE_1_SCALE },
];

export const BEER_CASE_2_MODEL_PATH = '/beerCase2.glb';

const BEER_CASE_2_ROTATION = [Math.PI / 2, 0, -0.016];

const BEER_CASE_2_SCALE = 0.016;

export const BEER_CASE_2_MATERIAL_NAME = 'sm32_128_BeerCase01A_A_Mat';

export const BEER_CASE_2_TRANSFORM_CHAIN = [
  { rotation: BEER_CASE_2_ROTATION, scale: BEER_CASE_2_SCALE },
];

export const CARDBOARD_SHARED_MATERIAL_NAME = 'zOther_Props_01_2';

export function CardboardBox1(props) {
  const { nodes, materials } = useDracoGltf(
    modelFile(CARDBOARD_BOX_1_MODEL_PATH)
  );
  return (
    <group {...props} dispose={null} scale={0.01}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.cardboard_box_1.geometry}
        material={materials[CARDBOARD_SHARED_MATERIAL_NAME]}
      />
    </group>
  );
}

export function CardboardBox2(props) {
  const { nodes, materials } = useDracoGltf(
    modelFile(CARDBOARD_BOX_2_MODEL_PATH)
  );
  return (
    <group {...props} dispose={null} scale={0.01}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.cardboard_box_2.geometry}
        material={materials[CARDBOARD_SHARED_MATERIAL_NAME]}
      />
    </group>
  );
}

export function CardboardBox3(props) {
  const { nodes, materials } = useDracoGltf(
    modelFile(CARDBOARD_BOX_3_MODEL_PATH)
  );
  return (
    <group {...props} dispose={null} scale={0.01}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.cardboard_box_3.geometry}
        material={materials[CARDBOARD_SHARED_MATERIAL_NAME]}
      />
    </group>
  );
}

export function CardboardBox4(props) {
  const { nodes, materials } = useDracoGltf(
    modelFile(CARDBOARD_BOX_4_MODEL_PATH)
  );
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_122.geometry}
        material={materials[CARDBOARD_BOX_4_MATERIAL_NAME]}
        rotation={CARDBOARD_BOX_4_ROTATION}
        scale={CARDBOARD_BOX_4_SCALE}
      />
    </group>
  );
}

export function CardboardBox5(props) {
  const { nodes, materials } = useDracoGltf(
    modelFile(CARDBOARD_BOX_5_MODEL_PATH)
  );
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_124.geometry}
        material={materials[CARDBOARD_BOX_5_MATERIAL_NAME]}
        rotation={CARDBOARD_BOX_5_ROTATION}
        scale={CARDBOARD_BOX_5_SCALE}
      />
    </group>
  );
}

export function BeerCase1(props) {
  const { nodes, materials } = useDracoGltf(modelFile(BEER_CASE_1_MODEL_PATH));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_118.geometry}
        material={materials[BEER_CASE_1_MATERIAL_NAME]}
        rotation={BEER_CASE_1_ROTATION}
        scale={BEER_CASE_1_SCALE}
      />
    </group>
  );
}

export function BeerCase2(props) {
  const { nodes, materials } = useDracoGltf(modelFile(BEER_CASE_2_MODEL_PATH));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_116.geometry}
        material={materials[BEER_CASE_2_MATERIAL_NAME]}
        rotation={BEER_CASE_2_ROTATION}
        scale={BEER_CASE_2_SCALE}
      />
    </group>
  );
}

useDracoGltf.preload(modelFile(CARDBOARD_BOX_1_MODEL_PATH));

useDracoGltf.preload(modelFile(CARDBOARD_BOX_2_MODEL_PATH));

useDracoGltf.preload(modelFile(CARDBOARD_BOX_3_MODEL_PATH));

useDracoGltf.preload(modelFile(CARDBOARD_BOX_4_MODEL_PATH));

useDracoGltf.preload(modelFile(CARDBOARD_BOX_5_MODEL_PATH));

useDracoGltf.preload(modelFile(BEER_CASE_1_MODEL_PATH));

useDracoGltf.preload(modelFile(BEER_CASE_2_MODEL_PATH));
