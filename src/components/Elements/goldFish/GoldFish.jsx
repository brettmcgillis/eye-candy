/* eslint-disable no-underscore-dangle */
import { SkeletonUtils } from 'three-stdlib';

import React from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { modelFile } from '../../../utils/appUtils';

export default function GoldFish(props) {
  const group = React.useRef();
  const { scene, animations } = useGLTF(modelFile('goldfish.glb'));
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  const { actions } = useAnimations(animations, group);
  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Scene">
        <group name="Object_12" rotation={[-Math.PI / 2, 0, 0]} scale={100}>
          <primitive object={nodes._rootJoint} />
        </group>
        <skinnedMesh
          name="Object_15"
          geometry={nodes.Object_15.geometry}
          material={materials.M_CometSp}
          skeleton={nodes.Object_15.skeleton}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={100}
        />
        <skinnedMesh
          name="Object_17"
          geometry={nodes.Object_17.geometry}
          material={materials.M_CometSp}
          skeleton={nodes.Object_17.skeleton}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={100}
        />
        <skinnedMesh
          name="Object_19"
          geometry={nodes.Object_19.geometry}
          material={materials.M_CometSp}
          skeleton={nodes.Object_19.skeleton}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={100}
        />
        <skinnedMesh
          name="Object_21"
          geometry={nodes.Object_21.geometry}
          material={materials.M_CometSp}
          skeleton={nodes.Object_21.skeleton}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={100}
        />
        <skinnedMesh
          name="Object_23"
          geometry={nodes.Object_23.geometry}
          material={materials.M_CometSp}
          skeleton={nodes.Object_23.skeleton}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={100}
        />
        <skinnedMesh
          name="Object_25"
          geometry={nodes.Object_25.geometry}
          material={materials.M_CometSp}
          skeleton={nodes.Object_25.skeleton}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={100}
        />
        <skinnedMesh
          name="Object_27"
          geometry={nodes.Object_27.geometry}
          material={materials.M_CometEyes}
          skeleton={nodes.Object_27.skeleton}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={100}
        />
        <skinnedMesh
          name="Object_75"
          geometry={nodes.Object_75.geometry}
          material={materials.M_CometSp}
          skeleton={nodes.Object_75.skeleton}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={100}
        />
        <skinnedMesh
          name="Object_77"
          geometry={nodes.Object_77.geometry}
          material={materials.M_CometSp}
          skeleton={nodes.Object_77.skeleton}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={100}
        />
        <skinnedMesh
          name="Object_79"
          geometry={nodes.Object_79.geometry}
          material={materials.M_CometEyes}
          skeleton={nodes.Object_79.skeleton}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={100}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('goldfish.glb'));
