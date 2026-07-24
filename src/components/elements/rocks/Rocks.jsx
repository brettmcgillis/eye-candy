import React, { createContext, useContext, useMemo } from 'react';

import { Merged, useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

const context = createContext();
const ROCK_COMPONENT_KEYS = [
  'Object',
  'Object1',
  'Object2',
  'Object3',
  'Object4',
  'Object5',
  'Object6',
  'Object7',
];
const ROCK_NODE_KEYS = [
  'Object_4',
  'Object_10',
  'Object_12',
  'Object_20',
  'Object_22',
  'Object_32',
  'Object_34',
  'Object_36',
];

export const ROCK_VARIANT_COUNT = ROCK_COMPONENT_KEYS.length;

export function RockInstances({ children, ...props }) {
  const { nodes } = useGLTF(modelFile('/rocks.glb'));
  const mergedMeshes = useMemo(
    () => ({
      Object: nodes.Object_4,
      Object1: nodes.Object_10,
      Object2: nodes.Object_12,
      Object3: nodes.Object_20,
      Object4: nodes.Object_22,
      Object5: nodes.Object_32,
      Object6: nodes.Object_34,
      Object7: nodes.Object_36,
    }),
    [nodes]
  );
  return (
    <Merged meshes={mergedMeshes} {...props}>
      {(instancesMap) => (
        <context.Provider value={instancesMap}>{children}</context.Provider>
      )}
    </Merged>
  );
}

export function Rocks(props) {
  const instances = useContext(context);
  return (
    <group {...props} dispose={null}>
      <instances.Object position={[-0.071, 0, -0.482]} />
      <instances.Object1 position={[-0.474, 0, 0.318]} />
      <instances.Object2 position={[0.347, 0, 0]} />
      <instances.Object3 position={[0.287, 0, 0.361]} />
      <instances.Object4 position={[-0.529, 0.05, 0]} />
      <instances.Object5 position={[-0.41, 0, -0.39]} />
      <instances.Object6 position={[0.35, 0, -0.441]} />
      <instances.Object7 position={[-0.071, 0, 0.315]} />
    </group>
  );
}

export function SingleRock({ variant = 0, ...props }) {
  const instances = useContext(context);

  if (!instances) {
    return null;
  }

  const variantIndex =
    ((variant % ROCK_VARIANT_COUNT) + ROCK_VARIANT_COUNT) % ROCK_VARIANT_COUNT;
  const RockComponent = instances[ROCK_COMPONENT_KEYS[variantIndex]];

  return (
    <group {...props} dispose={null}>
      <RockComponent />
    </group>
  );
}

export function PhysicalSingleRock({ variant = 0, ...props }) {
  const { nodes } = useGLTF(modelFile('/rocks.glb'));
  const variantIndex =
    ((variant % ROCK_VARIANT_COUNT) + ROCK_VARIANT_COUNT) % ROCK_VARIANT_COUNT;
  const node = nodes[ROCK_NODE_KEYS[variantIndex]];

  if (!node) {
    return null;
  }

  return (
    <mesh
      castShadow
      receiveShadow
      geometry={node.geometry}
      material={node.material}
      {...props}
    />
  );
}

useGLTF.preload(modelFile('/rocks.glb'));
