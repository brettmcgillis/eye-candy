/* eslint-disable no-underscore-dangle */
import React from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { SkeletonUtils } from 'three-stdlib';

import { modelFile } from '../../../utils/appUtils';

export default function AnimatedHorse(props) {
  const group = React.useRef();
  const { scene, animations } = useGLTF(modelFile('animated_horse.glb'));
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  const { actions } = useAnimations(animations, group);
  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Sketchfab_Scene">
        <primitive object={nodes._rootJoint} />
        <skinnedMesh
          name="Object_7"
          geometry={nodes.Object_7.geometry}
          material={materials.CH_NPC_MOB_WHorse_A02_MI_BYN}
          skeleton={nodes.Object_7.skeleton}
          rotation={[-Math.PI / 2, 0, -Math.PI]}
          scale={0.01}
        />
        <skinnedMesh
          name="Object_8"
          geometry={nodes.Object_8.geometry}
          material={materials.CH_NPC_MNT_WHsaddle01_MI_KEJ}
          skeleton={nodes.Object_8.skeleton}
          rotation={[-Math.PI / 2, 0, -Math.PI]}
          scale={0.01}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('animated_horse.glb'));
