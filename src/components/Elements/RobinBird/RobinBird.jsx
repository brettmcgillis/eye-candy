/* eslint-disable no-underscore-dangle */
import { SkeletonUtils } from 'three-stdlib';

import React from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { modelFile } from '../../../utils/appUtils';

export default function RobinBird(props) {
  const group = React.useRef();
  const { scene, animations } = useGLTF(modelFile('robin__bird.glb'));
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  const { actions } = useAnimations(animations, group);
  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Scene">
        <group name="Armature">
          <primitive object={nodes._rootJoint} />
        </group>
        <skinnedMesh
          name="Object_7"
          geometry={nodes.Object_7.geometry}
          material={materials.Robin_Bird_Merge}
          skeleton={nodes.Object_7.skeleton}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('robin__bird.glb'));
