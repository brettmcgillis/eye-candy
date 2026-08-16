import { SkeletonUtils } from 'three-stdlib';

import React from 'react';

import { useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { modelFile } from '../../../utils/appUtils';

export default function FamilyPrayingHands(props) {
  const { scene } = useGLTF(modelFile('family-praying-hands.glb'));
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  return (
    <group {...props} dispose={null}>
      <primitive object={nodes['DEF-upper_armR']} />
      <primitive object={nodes['DEF-upper_armR_1']} />
      <primitive object={nodes['DEF-upper_armR001']} />
      <primitive object={nodes['DEF-upper_armR001_1']} />
      <primitive object={nodes['DEF-upper_armR001_2']} />
      <primitive object={nodes['DEF-upper_armR001_1_1']} />
      <skinnedMesh
        geometry={nodes.Female_arm_hand.geometry}
        material={materials.defaultMat1}
        skeleton={nodes.Female_arm_hand.skeleton}
        position={[0.024, -0.088, -0.001]}
        scale={1.25}
      />
      <skinnedMesh
        geometry={nodes.Female_arm_hand_1.geometry}
        material={materials.defaultMat1}
        skeleton={nodes.Female_arm_hand_1.skeleton}
        position={[-0.02, -0.088, -0.001]}
        scale={[-1.25, 1.25, 1.25]}
      />
      <skinnedMesh
        geometry={nodes.Male_arm_hand1.geometry}
        material={materials.defaultMat1}
        skeleton={nodes.Male_arm_hand1.skeleton}
        position={[0.026, -0.095, -0.001]}
        scale={1.35}
      />
      <skinnedMesh
        geometry={nodes.Male_arm_hand1_1.geometry}
        material={materials.defaultMat1}
        skeleton={nodes.Male_arm_hand1_1.skeleton}
        position={[-0.021, -0.095, -0.001]}
        scale={[-1.35, 1.35, 1.35]}
      />
      <skinnedMesh
        geometry={nodes.ZBrushPolyMesh3D.geometry}
        material={materials.defaultMat1}
        skeleton={nodes.ZBrushPolyMesh3D.skeleton}
        position={[0.03, -0.106, -0.008]}
        scale={1.15}
      />
      <skinnedMesh
        geometry={nodes.ZBrushPolyMesh3D_1.geometry}
        material={materials.defaultMat1}
        skeleton={nodes.ZBrushPolyMesh3D_1.skeleton}
        position={[-0.026, -0.106, -0.008]}
        scale={[-1.15, 1.15, 1.15]}
      />
    </group>
  );
}

useGLTF.preload(modelFile('family-praying-hands.glb'));
