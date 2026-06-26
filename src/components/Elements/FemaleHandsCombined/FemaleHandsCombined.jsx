import { SkeletonUtils } from 'three-stdlib';

import React from 'react';

import { Merged, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { modelFile } from '../../../utils/appUtils';

const context = React.createContext();

export function Instances({ children, ...props }) {
  const { nodes } = useGLTF(modelFile('femalehandscombined.glb'));
  const instances = React.useMemo(
    () => ({
      Femalearmhand: nodes.Female_arm_hand,
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

export default function FemaleHandsCombined(props) {
  const instances = React.useContext(context);
  const { scene } = useGLTF(modelFile('femalehandscombined.glb'));
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  return (
    <group {...props} dispose={null}>
      <primitive object={nodes['DEF-upper_armR001']} />
      <primitive object={nodes['DEF-upper_armR001_1']} />
      <instances.Femalearmhand position={[0, -0.071, -0.001]} />
      <instances.Femalearmhand
        position={[0, -0.071, -0.001]}
        scale={[-1, 1, 1]}
      />
    </group>
  );
}

useGLTF.preload(modelFile('femalehandscombined.glb'));
