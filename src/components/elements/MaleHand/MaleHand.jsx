import React from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { SkeletonUtils } from 'three-stdlib';

import { modelFile } from '@utils/appUtils';

export default function MaleHand(props) {
  const group = React.useRef();
  const { scene, animations } = useGLTF(modelFile('MaleHand.glb'));
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  const { actions } = useAnimations(animations, group);
  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Scene">
        <group name="Male_Rigged_Highpoly_decimated_Female_arm_hand_Rigify">
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
          name="Male_arm_hand1"
          geometry={nodes.Male_arm_hand1.geometry}
          material={materials.Male_arm_hand1}
          skeleton={nodes.Male_arm_hand1.skeleton}
          morphTargetDictionary={nodes.Male_arm_hand1.morphTargetDictionary}
          morphTargetInfluences={nodes.Male_arm_hand1.morphTargetInfluences}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('MaleHand.glb'));
