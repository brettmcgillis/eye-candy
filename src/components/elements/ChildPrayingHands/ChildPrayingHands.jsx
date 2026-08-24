import React from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { SkeletonUtils } from 'three-stdlib';

import { modelFile } from '@utils/appUtils';

export default function ChildPrayingHands(props) {
  const group = React.useRef();
  const { scene, animations } = useGLTF(modelFile('child-praying-hands.glb'));
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  const { actions } = useAnimations(animations, group);
  return (
    <group ref={group} {...props} dispose={null}>
      <group name="AuxScene">
        <group name="ChildHandCleanGlb_1" position={[-0.01, 0, 0]}>
          <primitive object={nodes['DEF-upper_armR']} />
        </group>
        <group
          name="ChildHandCleanGlb_2"
          position={[0.01, 0, 0]}
          scale={[-1, 1, 1]}
        >
          <primitive object={nodes['DEF-upper_armR_1']} />
        </group>
        <skinnedMesh
          name="ZBrushPolyMesh3D"
          geometry={nodes.ZBrushPolyMesh3D.geometry}
          material={materials.defaultMat1}
          skeleton={nodes.ZBrushPolyMesh3D.skeleton}
          position={[0.024, -0.083, -0.007]}
        />
        <skinnedMesh
          name="ZBrushPolyMesh3D_1"
          geometry={nodes.ZBrushPolyMesh3D_1.geometry}
          material={materials.defaultMat1}
          skeleton={nodes.ZBrushPolyMesh3D_1.skeleton}
          position={[-0.024, -0.083, -0.007]}
          scale={[-1, 1, 1]}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('child-praying-hands.glb'));
