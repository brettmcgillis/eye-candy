import React, { useEffect, useMemo } from 'react';

import { createInstances, useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';
import bakeInstancedGeometry from '../../../utils/instancedGeometry';

const STARBUCKS_MODEL_PATH = '/starbucks.glb';
const STARBUCKS_ROTATION = [-Math.PI / 2, 0, 0];
const STARBUCKS_TRANSFORM_CHAIN = [
  { rotation: STARBUCKS_ROTATION, scale: 0.05 },
  { position: [0, 0, 6.705], rotation: [0, 0, -0.351], scale: 0.13 },
];

const [StarbucksCupInstancesRoot, StarbucksCupInstanceRoot] = createInstances();

export function StarbucksCupInstances({ children, material, ...props }) {
  const { nodes, materials } = useGLTF(modelFile(STARBUCKS_MODEL_PATH));
  const baseGeometry = nodes.starbuckscup2_0.geometry;
  const sourceMaterial = materials.starbuckscup2_0_mat;
  const geometry = useMemo(
    () => bakeInstancedGeometry(baseGeometry, STARBUCKS_TRANSFORM_CHAIN),
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
    <StarbucksCupInstancesRoot
      geometry={geometry}
      material={instanceMaterial}
      {...props}
    >
      {children}
    </StarbucksCupInstancesRoot>
  );
}

export function StarbucksCupInstance(props) {
  return <StarbucksCupInstanceRoot {...props} />;
}

export function StarbucksCup(props) {
  const { nodes, materials } = useGLTF(modelFile(STARBUCKS_MODEL_PATH));

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

useGLTF.preload(modelFile(STARBUCKS_MODEL_PATH));
