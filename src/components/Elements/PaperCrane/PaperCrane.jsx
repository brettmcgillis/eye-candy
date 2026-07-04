import React, { useEffect, useMemo } from 'react';

import { createInstances, useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';
import bakeInstancedGeometry from '../../../utils/instancedGeometry';

const PAPER_CRANE_MODEL_FILE = modelFile('paper_crane.glb');
const BODY_MATERIAL_NAME = 'PapelOrigami';
const SHADOW_MATERIAL_NAME = 'Sombra';
const CRANE_TRANSFORM_CHAIN = [{ rotation: [-Math.PI / 2, 0, 0] }];

const [PaperCraneBodyInstancesRoot, PaperCraneBodyInstanceRoot] =
  createInstances();
const [PaperCraneShadowInstancesRoot, PaperCraneShadowInstanceRoot] =
  createInstances();

function usePaperCraneModel() {
  const { nodes, materials } = useGLTF(PAPER_CRANE_MODEL_FILE);

  return {
    foldLinesGeometry: nodes.Object_2.geometry,
    bodyGeometry: nodes.Object_3.geometry,
    shadowGeometry: nodes.Object_4.geometry,
    bodyMaterial: materials[BODY_MATERIAL_NAME],
    shadowMaterial: materials[SHADOW_MATERIAL_NAME],
  };
}

function useBakedGeometry(baseGeometry) {
  const geometry = useMemo(
    () => bakeInstancedGeometry(baseGeometry, CRANE_TRANSFORM_CHAIN),
    [baseGeometry]
  );

  useEffect(() => {
    return () => {
      geometry.dispose?.();
    };
  }, [geometry]);

  return geometry;
}

// Instanced body (folded paper mesh) — the piece physics/rigid bodies should
// collide against. Pair with PaperCraneShadowInstances for the full look; the
// wireframe fold-line detail is skipped for instanced use (see PaperCrane
// below for the single-copy version that includes it).
export function PaperCraneBodyInstances({ children, material, ...props }) {
  const { bodyGeometry, bodyMaterial } = usePaperCraneModel();
  const geometry = useBakedGeometry(bodyGeometry);
  const instanceMaterial = useMemo(
    () => material ?? bodyMaterial.clone(),
    [material, bodyMaterial]
  );

  useEffect(() => {
    if (material) return undefined;

    return () => {
      instanceMaterial.dispose?.();
    };
  }, [instanceMaterial, material]);

  return (
    <PaperCraneBodyInstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </PaperCraneBodyInstancesRoot>
  );
}

export function PaperCraneBodyInstance(props) {
  return <PaperCraneBodyInstanceRoot {...props} />;
}

// Instanced shadow-crease overlay (alpha-blended). Purely decorative — has no
// collider of its own. Consumers sync its instance transforms to the body's
// by sharing the same instanceMatrix attribute (see CranePool.jsx).
export function PaperCraneShadowInstances({ children, material, ...props }) {
  const { shadowGeometry, shadowMaterial } = usePaperCraneModel();
  const geometry = useBakedGeometry(shadowGeometry);
  const instanceMaterial = useMemo(
    () => material ?? shadowMaterial.clone(),
    [material, shadowMaterial]
  );

  useEffect(() => {
    if (material) return undefined;

    return () => {
      instanceMaterial.dispose?.();
    };
  }, [instanceMaterial, material]);

  return (
    <PaperCraneShadowInstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </PaperCraneShadowInstancesRoot>
  );
}

export function PaperCraneShadowInstance(props) {
  return <PaperCraneShadowInstanceRoot {...props} />;
}

export default function PaperCrane(props) {
  const { nodes, materials } = useGLTF(PAPER_CRANE_MODEL_FILE);
  return (
    <group {...props} dispose={null}>
      <lineSegments
        geometry={nodes.Object_2.geometry}
        material={materials[BODY_MATERIAL_NAME]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_3.geometry}
        material={materials[BODY_MATERIAL_NAME]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_4.geometry}
        material={materials[SHADOW_MATERIAL_NAME]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
    </group>
  );
}

useGLTF.preload(PAPER_CRANE_MODEL_FILE);
