import { SkeletonUtils } from 'three-stdlib';

import React from 'react';

import { useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { modelFile } from '../../../utils/appUtils';

export default function FemaleHandClean(props) {
  const { scene } = useGLTF(modelFile('Female-hand-clean.glb'));
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  return (
    <group {...props} dispose={null}>
      <primitive object={nodes['DEF-upper_armR001']} />
      <skinnedMesh
        geometry={nodes.Female_arm_hand.geometry}
        material={materials.Female_arm_hand}
        skeleton={nodes.Female_arm_hand.skeleton}
        position={[0.03, -0.071, -0.001]}
      />
    </group>
  );
}

useGLTF.preload(modelFile('Female-hand-clean.glb'));
