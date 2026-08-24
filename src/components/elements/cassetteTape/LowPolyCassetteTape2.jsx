import React, { useEffect, useMemo } from 'react';

import { createInstances, useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';
import bakeInstancedGeometry from '@utils/instancedGeometry';

const LOW_POLY_CASSETTE_TAPE_2_MODEL_PATH = '/lowPolyCassette2.glb';
const LOW_POLY_CASSETTE_TAPE_2_NODE_NAME =
  'prop_cassette_tape_01002_audio_cassette_a_0';
const LOW_POLY_CASSETTE_TAPE_2_MATERIAL_NAME = 'audio_cassette_a';
const LOW_POLY_CASSETTE_TAPE_2_MODEL_SCALE = 0.04;
const LOW_POLY_CASSETTE_TAPE_2_TRANSFORM_CHAIN = [
  { scale: LOW_POLY_CASSETTE_TAPE_2_MODEL_SCALE },
];

const [LowPolyCassetteTape2InstancesRoot, LowPolyCassetteTape2InstanceRoot] =
  createInstances();

export function LowPolyCassetteTape2Instances({
  children,
  material,
  ...props
}) {
  const { nodes, materials } = useGLTF(
    modelFile(LOW_POLY_CASSETTE_TAPE_2_MODEL_PATH)
  );
  const baseGeometry = nodes[LOW_POLY_CASSETTE_TAPE_2_NODE_NAME].geometry;
  const sourceMaterial = materials[LOW_POLY_CASSETTE_TAPE_2_MATERIAL_NAME];
  const geometry = useMemo(
    () =>
      bakeInstancedGeometry(
        baseGeometry,
        LOW_POLY_CASSETTE_TAPE_2_TRANSFORM_CHAIN
      ),
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
    <LowPolyCassetteTape2InstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </LowPolyCassetteTape2InstancesRoot>
  );
}

export function LowPolyCassetteTape2Instance(props) {
  return <LowPolyCassetteTape2InstanceRoot {...props} />;
}

export function LowPolyCassetteTape2(props) {
  const { nodes, materials } = useGLTF(
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

useGLTF.preload(modelFile(LOW_POLY_CASSETTE_TAPE_2_MODEL_PATH));
