import React from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { SkeletonUtils } from 'three-stdlib';

import { modelFile } from '@utils/appUtils';

export default function FemaleHand(props) {
  const group = React.useRef();
  const { scene, animations } = useGLTF(modelFile('FemaleHand.glb'));
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  const { actions } = useAnimations(animations, group);
  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Scene">
        <group name="Rigged_Female_arm_hand_Rigify">
          <primitive object={nodes.root} />
          <primitive object={nodes['MCH-torsoparent']} />
          <primitive object={nodes['MCH-hand_ikparentL']} />
          <primitive object={nodes['MCH-upper_arm_ik_targetparentL']} />
          <primitive object={nodes['MCH-hand_ikparentR']} />
          <primitive object={nodes['MCH-upper_arm_ik_targetparentR']} />
          <primitive object={nodes['MCH-foot_ikparentL']} />
          <primitive object={nodes['MCH-thigh_ik_targetparentL']} />
          <primitive object={nodes['MCH-foot_ikparentR']} />
          <primitive object={nodes['MCH-thigh_ik_targetparentR']} />
        </group>
        <skinnedMesh
          name="Female_arm_hand"
          geometry={nodes.Female_arm_hand.geometry}
          material={materials.Female_arm_hand}
          skeleton={nodes.Female_arm_hand.skeleton}
          morphTargetDictionary={nodes.Female_arm_hand.morphTargetDictionary}
          morphTargetInfluences={nodes.Female_arm_hand.morphTargetInfluences}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('FemaleHand.glb'));
