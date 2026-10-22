import React, { useEffect, useMemo } from 'react';

import { createInstances } from '@react-three/drei';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';
import bakeInstancedGeometry from '@utils/instancedGeometry';

import {
  BEER_CASE_1_MATERIAL_NAME,
  BEER_CASE_1_MODEL_PATH,
  BEER_CASE_1_TRANSFORM_CHAIN,
  BEER_CASE_2_MATERIAL_NAME,
  BEER_CASE_2_MODEL_PATH,
  BEER_CASE_2_TRANSFORM_CHAIN,
  CARDBOARD_BOX_1_MODEL_PATH,
  CARDBOARD_BOX_1_TRANSFORM_CHAIN,
  CARDBOARD_BOX_2_MODEL_PATH,
  CARDBOARD_BOX_2_TRANSFORM_CHAIN,
  CARDBOARD_BOX_3_MODEL_PATH,
  CARDBOARD_BOX_3_TRANSFORM_CHAIN,
  CARDBOARD_BOX_4_MATERIAL_NAME,
  CARDBOARD_BOX_4_MODEL_PATH,
  CARDBOARD_BOX_4_TRANSFORM_CHAIN,
  CARDBOARD_BOX_5_MATERIAL_NAME,
  CARDBOARD_BOX_5_MODEL_PATH,
  CARDBOARD_BOX_5_TRANSFORM_CHAIN,
  CARDBOARD_SHARED_MATERIAL_NAME,
} from './CardboardBoxes';

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
  const { nodes, materials } = useDracoGltf(
    modelFile(CARDBOARD_BOX_1_MODEL_PATH)
  );
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
  const { nodes, materials } = useDracoGltf(
    modelFile(CARDBOARD_BOX_2_MODEL_PATH)
  );
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
  const { nodes, materials } = useDracoGltf(
    modelFile(CARDBOARD_BOX_3_MODEL_PATH)
  );
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
  const { nodes, materials } = useDracoGltf(
    modelFile(CARDBOARD_BOX_4_MODEL_PATH)
  );
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
  const { nodes, materials } = useDracoGltf(
    modelFile(CARDBOARD_BOX_5_MODEL_PATH)
  );
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
  const { nodes, materials } = useDracoGltf(modelFile(BEER_CASE_1_MODEL_PATH));
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
  const { nodes, materials } = useDracoGltf(modelFile(BEER_CASE_2_MODEL_PATH));
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
