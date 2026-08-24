import React from 'react';

import { useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { SkeletonUtils } from 'three-stdlib';

import { modelFile } from '@utils/appUtils';

export default function ChildHandClean(props) {
  const { scene } = useGLTF(modelFile('Child-hand-clean.glb'));
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  return (
    <group {...props} dispose={null}>
      <primitive object={nodes['DEF-upper_armR']} />
      <skinnedMesh
        geometry={nodes.ZBrushPolyMesh3D.geometry}
        material={materials.defaultMat1}
        skeleton={nodes.ZBrushPolyMesh3D.skeleton}
        position={[0.034, -0.083, -0.007]}
      />
    </group>
  );
}

useGLTF.preload(modelFile('Child-hand-clean.glb'));
