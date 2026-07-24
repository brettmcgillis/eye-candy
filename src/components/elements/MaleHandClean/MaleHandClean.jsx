import { SkeletonUtils } from 'three-stdlib';

import React from 'react';

import { useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { modelFile } from '../../../utils/appUtils';

export default function MaleHandClean(props) {
  const { scene } = useGLTF(modelFile('Male-hand-clean.glb'));
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  return (
    <group {...props} dispose={null}>
      <primitive object={nodes['DEF-upper_armR001']} />
      <skinnedMesh
        geometry={nodes.Male_arm_hand1.geometry}
        material={materials.Male_arm_hand1}
        skeleton={nodes.Male_arm_hand1.skeleton}
        position={[0.029, -0.071, -0.001]}
      />
    </group>
  );
}

useGLTF.preload(modelFile('Male-hand-clean.glb'));
