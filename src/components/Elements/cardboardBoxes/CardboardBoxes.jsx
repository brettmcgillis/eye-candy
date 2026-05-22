import React, { useEffect, useMemo } from 'react';

import { createInstances, useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';
import bakeInstancedGeometry from '../../../utils/instancedGeometry';

const CARDBOARD_BOX_1_MODEL_PATH = '/cardboardbox1.glb';
const CARDBOARD_BOX_1_TRANSFORM_CHAIN = [{ scale: 0.01 }];

const CARDBOARD_BOX_2_MODEL_PATH = '/cardboardbox2.glb';
const CARDBOARD_BOX_2_TRANSFORM_CHAIN = [{ scale: 0.01 }];

const CARDBOARD_BOX_3_MODEL_PATH = '/cardboardbox3.glb';
const CARDBOARD_BOX_3_TRANSFORM_CHAIN = [{ scale: 0.01 }];

const CARDBOARD_BOX_4_MODEL_PATH = '/cardboardBox4.glb';
const CARDBOARD_BOX_4_ROTATION = [Math.PI / 2, 0, 0];
const CARDBOARD_BOX_4_SCALE = 0.01;
const CARDBOARD_BOX_4_MATERIAL_NAME = 'sm36_002_Cardboard01A_A_Mat';
const CARDBOARD_BOX_4_TRANSFORM_CHAIN = [
  { rotation: CARDBOARD_BOX_4_ROTATION, scale: CARDBOARD_BOX_4_SCALE },
];

const CARDBOARD_BOX_5_MODEL_PATH = '/cardboardBox5.glb';
const CARDBOARD_BOX_5_ROTATION = [Math.PI / 2, 0, -0.05];
const CARDBOARD_BOX_5_SCALE = 0.019;
const CARDBOARD_BOX_5_MATERIAL_NAME = 'sm36_004_Cardboard03A_A_Mat';
const CARDBOARD_BOX_5_TRANSFORM_CHAIN = [
  { rotation: CARDBOARD_BOX_5_ROTATION, scale: CARDBOARD_BOX_5_SCALE },
];

const BEER_CASE_1_MODEL_PATH = '/beerCase1.glb';
const BEER_CASE_1_ROTATION = [Math.PI / 2, 0, -0.016];
const BEER_CASE_1_SCALE = 0.02;
const BEER_CASE_1_MATERIAL_NAME = 'sm32_143_BeerCase01A_A_Mat';
const BEER_CASE_1_TRANSFORM_CHAIN = [
  { rotation: BEER_CASE_1_ROTATION, scale: BEER_CASE_1_SCALE },
];

const BEER_CASE_2_MODEL_PATH = '/beerCase2.glb';
const BEER_CASE_2_ROTATION = [Math.PI / 2, 0, -0.016];
const BEER_CASE_2_SCALE = 0.016;
const BEER_CASE_2_MATERIAL_NAME = 'sm32_128_BeerCase01A_A_Mat';
const BEER_CASE_2_TRANSFORM_CHAIN = [
  { rotation: BEER_CASE_2_ROTATION, scale: BEER_CASE_2_SCALE },
];

const CARDBOARD_SHARED_MATERIAL_NAME = 'zOther_Props_01_2';

const [CardboardBox1InstancesRoot, CardboardBox1InstanceRoot] =
  createInstances();
const [CardboardBox2InstancesRoot, CardboardBox2InstanceRoot] =
  createInstances();
const [CardboardBox3InstancesRoot, CardboardBox3InstanceRoot] =
  createInstances();
const [CardboardBox4InstancesRoot, CardboardBox4InstanceRoot] =
  createInstances();
const [CardboardBox5InstancesRoot, CardboardBox5InstanceRoot] =
  createInstances();
const [BeerCase1InstancesRoot, BeerCase1InstanceRoot] = createInstances();
const [BeerCase2InstancesRoot, BeerCase2InstanceRoot] = createInstances();

export function CardboardBox1Instances({ children, material, ...props }) {
  const { nodes, materials } = useGLTF(modelFile(CARDBOARD_BOX_1_MODEL_PATH));
  const baseGeometry = nodes.cardboard_box_1.geometry;
  const sourceMaterial = materials[CARDBOARD_SHARED_MATERIAL_NAME];
  const geometry = useMemo(
    () => bakeInstancedGeometry(baseGeometry, CARDBOARD_BOX_1_TRANSFORM_CHAIN),
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
    <CardboardBox1InstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </CardboardBox1InstancesRoot>
  );
}

export function CardboardBox1Instance(props) {
  return <CardboardBox1InstanceRoot {...props} />;
}

export function CardboardBox2Instances({ children, material, ...props }) {
  const { nodes, materials } = useGLTF(modelFile(CARDBOARD_BOX_2_MODEL_PATH));
  const baseGeometry = nodes.cardboard_box_2.geometry;
  const sourceMaterial = materials[CARDBOARD_SHARED_MATERIAL_NAME];
  const geometry = useMemo(
    () => bakeInstancedGeometry(baseGeometry, CARDBOARD_BOX_2_TRANSFORM_CHAIN),
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
    <CardboardBox2InstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </CardboardBox2InstancesRoot>
  );
}

export function CardboardBox2Instance(props) {
  return <CardboardBox2InstanceRoot {...props} />;
}

export function CardboardBox3Instances({ children, material, ...props }) {
  const { nodes, materials } = useGLTF(modelFile(CARDBOARD_BOX_3_MODEL_PATH));
  const baseGeometry = nodes.cardboard_box_3.geometry;
  const sourceMaterial = materials[CARDBOARD_SHARED_MATERIAL_NAME];
  const geometry = useMemo(
    () => bakeInstancedGeometry(baseGeometry, CARDBOARD_BOX_3_TRANSFORM_CHAIN),
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
    <CardboardBox3InstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </CardboardBox3InstancesRoot>
  );
}

export function CardboardBox3Instance(props) {
  return <CardboardBox3InstanceRoot {...props} />;
}

export function CardboardBox4Instances({ children, material, ...props }) {
  const { nodes, materials } = useGLTF(modelFile(CARDBOARD_BOX_4_MODEL_PATH));
  const baseGeometry = nodes.Object_122.geometry;
  const sourceMaterial = materials[CARDBOARD_BOX_4_MATERIAL_NAME];
  const geometry = useMemo(
    () => bakeInstancedGeometry(baseGeometry, CARDBOARD_BOX_4_TRANSFORM_CHAIN),
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
    <CardboardBox4InstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </CardboardBox4InstancesRoot>
  );
}

export function CardboardBox4Instance(props) {
  return <CardboardBox4InstanceRoot {...props} />;
}

export function CardboardBox5Instances({ children, material, ...props }) {
  const { nodes, materials } = useGLTF(modelFile(CARDBOARD_BOX_5_MODEL_PATH));
  const baseGeometry = nodes.Object_124.geometry;
  const sourceMaterial = materials[CARDBOARD_BOX_5_MATERIAL_NAME];
  const geometry = useMemo(
    () => bakeInstancedGeometry(baseGeometry, CARDBOARD_BOX_5_TRANSFORM_CHAIN),
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
    <CardboardBox5InstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </CardboardBox5InstancesRoot>
  );
}

export function CardboardBox5Instance(props) {
  return <CardboardBox5InstanceRoot {...props} />;
}

export function BeerCase1Instances({ children, material, ...props }) {
  const { nodes, materials } = useGLTF(modelFile(BEER_CASE_1_MODEL_PATH));
  const baseGeometry = nodes.Object_118.geometry;
  const sourceMaterial = materials[BEER_CASE_1_MATERIAL_NAME];
  const geometry = useMemo(
    () => bakeInstancedGeometry(baseGeometry, BEER_CASE_1_TRANSFORM_CHAIN),
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
    <BeerCase1InstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </BeerCase1InstancesRoot>
  );
}

export function BeerCase1Instance(props) {
  return <BeerCase1InstanceRoot {...props} />;
}

export function BeerCase2Instances({ children, material, ...props }) {
  const { nodes, materials } = useGLTF(modelFile(BEER_CASE_2_MODEL_PATH));
  const baseGeometry = nodes.Object_116.geometry;
  const sourceMaterial = materials[BEER_CASE_2_MATERIAL_NAME];
  const geometry = useMemo(
    () => bakeInstancedGeometry(baseGeometry, BEER_CASE_2_TRANSFORM_CHAIN),
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
    <BeerCase2InstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </BeerCase2InstancesRoot>
  );
}

export function BeerCase2Instance(props) {
  return <BeerCase2InstanceRoot {...props} />;
}

export function CardboardBox1(props) {
  const { nodes, materials } = useGLTF(modelFile(CARDBOARD_BOX_1_MODEL_PATH));
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
  const { nodes, materials } = useGLTF(modelFile(CARDBOARD_BOX_2_MODEL_PATH));
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
  const { nodes, materials } = useGLTF(modelFile(CARDBOARD_BOX_3_MODEL_PATH));
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
  const { nodes, materials } = useGLTF(modelFile(CARDBOARD_BOX_4_MODEL_PATH));
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
  const { nodes, materials } = useGLTF(modelFile(CARDBOARD_BOX_5_MODEL_PATH));
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
  const { nodes, materials } = useGLTF(modelFile(BEER_CASE_1_MODEL_PATH));
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
  const { nodes, materials } = useGLTF(modelFile(BEER_CASE_2_MODEL_PATH));
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

useGLTF.preload(modelFile(CARDBOARD_BOX_1_MODEL_PATH));
useGLTF.preload(modelFile(CARDBOARD_BOX_2_MODEL_PATH));
useGLTF.preload(modelFile(CARDBOARD_BOX_3_MODEL_PATH));
useGLTF.preload(modelFile(CARDBOARD_BOX_4_MODEL_PATH));
useGLTF.preload(modelFile(CARDBOARD_BOX_5_MODEL_PATH));
useGLTF.preload(modelFile(BEER_CASE_1_MODEL_PATH));
useGLTF.preload(modelFile(BEER_CASE_2_MODEL_PATH));
