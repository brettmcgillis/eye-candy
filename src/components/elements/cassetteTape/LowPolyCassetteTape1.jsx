import React, { useEffect, useMemo } from 'react';

import { createInstances, useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';
import bakeInstancedGeometry from '@utils/instancedGeometry';

const LOW_POLY_CASSETTE_TAPE_1_MODEL_PATH = '/lowPolyCassette1.glb';
const LOW_POLY_CASSETTE_TAPE_1_NODE_NAME =
  'prop_cassette_tape_01003_audio_cassette_c_0';
const LOW_POLY_CASSETTE_TAPE_1_MATERIAL_NAME = 'audio_cassette_c';
const LOW_POLY_CASSETTE_TAPE_1_MODEL_SCALE = 0.04;
const LOW_POLY_CASSETTE_TAPE_1_TRANSFORM_CHAIN = [
  { scale: LOW_POLY_CASSETTE_TAPE_1_MODEL_SCALE },
];

const [LowPolyCassetteTape1InstancesRoot, LowPolyCassetteTape1InstanceRoot] =
  createInstances();

export function LowPolyCassetteTape1Instances({
  children,
  material,
  ...props
}) {
  const { nodes, materials } = useGLTF(
    modelFile(LOW_POLY_CASSETTE_TAPE_1_MODEL_PATH)
  );
  const baseGeometry = nodes[LOW_POLY_CASSETTE_TAPE_1_NODE_NAME].geometry;
  const sourceMaterial = materials[LOW_POLY_CASSETTE_TAPE_1_MATERIAL_NAME];
  const geometry = useMemo(
    () =>
      bakeInstancedGeometry(
        baseGeometry,
        LOW_POLY_CASSETTE_TAPE_1_TRANSFORM_CHAIN
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
    <LowPolyCassetteTape1InstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </LowPolyCassetteTape1InstancesRoot>
  );
}

export function LowPolyCassetteTape1Instance(props) {
  return <LowPolyCassetteTape1InstanceRoot {...props} />;
}

export function LowPolyCassetteTape1(props) {
  const { nodes, materials } = useGLTF(
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

useGLTF.preload(modelFile(LOW_POLY_CASSETTE_TAPE_1_MODEL_PATH));
