import { SkeletonUtils } from 'three-stdlib';

import React from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { modelFile } from '../../../utils/appUtils';

export default function ChildHand(props) {
  const group = React.useRef();
  const { scene, animations } = useGLTF(modelFile('ChildHand.glb'));
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  const { actions } = useAnimations(animations, group);
  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Scene">
        <group name="Child_Rigged_Highpoly_decimated_Female_arm_hand_Rigify">
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
          name="ZBrushPolyMesh3D"
          geometry={nodes.ZBrushPolyMesh3D.geometry}
          material={materials.defaultMat1}
          skeleton={nodes.ZBrushPolyMesh3D.skeleton}
          morphTargetDictionary={nodes.ZBrushPolyMesh3D.morphTargetDictionary}
          morphTargetInfluences={nodes.ZBrushPolyMesh3D.morphTargetInfluences}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('ChildHand.glb'));
