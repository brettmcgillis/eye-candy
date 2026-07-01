import { SkeletonUtils } from 'three-stdlib';

import React from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { modelFile } from '../../../utils/appUtils';

export default function FemalePrayingHands(props) {
  const group = React.useRef();
  const { scene, animations } = useGLTF(modelFile('female-praying-hands.glb'));
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  const { actions } = useAnimations(animations, group);
  return (
    <group ref={group} {...props} dispose={null}>
      <group name="AuxScene">
        <group name="FemaleHandCleanGlb_1" position={[-0.01, 0, 0]}>
          <primitive object={nodes['DEF-upper_armR001']} />
        </group>
        <group
          name="FemaleHandCleanGlb_2"
          position={[0.014, 0, 0]}
          scale={[-1, 1, 1]}
        >
          <primitive object={nodes['DEF-upper_armR001_1']} />
        </group>
        <skinnedMesh
          name="Female_arm_hand"
          geometry={nodes.Female_arm_hand.geometry}
          material={materials.Female_arm_hand}
          skeleton={nodes.Female_arm_hand.skeleton}
          position={[0.02, -0.071, -0.001]}
        />
        <skinnedMesh
          name="Female_arm_hand_1"
          geometry={nodes.Female_arm_hand_1.geometry}
          material={materials.Female_arm_hand}
          skeleton={nodes.Female_arm_hand_1.skeleton}
          position={[-0.016, -0.071, -0.001]}
          scale={[-1, 1, 1]}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('female-praying-hands.glb'));
