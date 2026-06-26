import { SkeletonUtils } from 'three-stdlib';

import React from 'react';

import { Merged, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { modelFile } from '../../../utils/appUtils';

const context = React.createContext();

export function Instances({ children, ...props }) {
  const { nodes } = useGLTF(modelFile('childhandscombined.glb'));
  const instances = React.useMemo(
    () => ({
      ZBrushPolyMeshD: nodes.ZBrushPolyMesh3D,
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

export default function ChildHandsCombined(props) {
  const instances = React.useContext(context);
  const { scene } = useGLTF(modelFile('childhandscombined.glb'));
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  return (
    <group {...props} dispose={null}>
      <primitive object={nodes['DEF-upper_armR']} />
      <primitive object={nodes['DEF-upper_armR_1']} />
      <instances.ZBrushPolyMeshD position={[0.014, -0.083, -0.007]} />
      <instances.ZBrushPolyMeshD
        position={[-0.014, -0.083, -0.007]}
        scale={[-1, 1, 1]}
      />
    </group>
  );
}

useGLTF.preload(modelFile('childhandscombined.glb'));
