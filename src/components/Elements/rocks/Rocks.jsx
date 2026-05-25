import React, { createContext, useContext, useMemo } from 'react';

import { Merged, useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

const context = createContext();
export function RockInstances({ children, ...props }) {
  const { nodes } = useGLTF(modelFile('/rocks.glb'));
  const instances = useMemo(
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
    <Merged meshes={instances} {...props}>
      {(instances) => (
        <context.Provider value={instances} children={children} />
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

useGLTF.preload(modelFile('/rocks.glb'));
