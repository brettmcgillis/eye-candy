import React from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { SkeletonUtils } from 'three-stdlib';

import { modelFile } from '@utils/appUtils';

export default function MalePrayingHands(props) {
  const group = React.useRef();
  const { scene, animations } = useGLTF(modelFile('male-praying-hands.glb'));
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  const { actions } = useAnimations(animations, group);
  return (
    <group ref={group} {...props} dispose={null}>
      <group name="AuxScene">
        <group name="MaleHandCleanGlb_1" position={[-0.01, 0, 0]}>
          <primitive object={nodes['DEF-upper_armR001']} />
        </group>
        <group
          name="MaleHandCleanGlb_2"
          position={[0.014, 0, 0]}
          scale={[-1, 1, 1]}
        >
          <primitive object={nodes['DEF-upper_armR001_1']} />
        </group>
        <skinnedMesh
          name="Male_arm_hand1"
          geometry={nodes.Male_arm_hand1.geometry}
          material={materials.Male_arm_hand1}
          skeleton={nodes.Male_arm_hand1.skeleton}
          position={[0.019, -0.071, -0.001]}
        />
        <skinnedMesh
          name="Male_arm_hand1_1"
          geometry={nodes.Male_arm_hand1_1.geometry}
          material={materials.Male_arm_hand1}
          skeleton={nodes.Male_arm_hand1_1.skeleton}
          position={[-0.016, -0.071, -0.001]}
          scale={[-1, 1, 1]}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('male-praying-hands.glb'));
