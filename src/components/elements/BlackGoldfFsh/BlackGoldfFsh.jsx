/* eslint-disable no-underscore-dangle */
import React from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { SkeletonUtils } from 'three-stdlib';

import { modelFile } from '@utils/appUtils';

export default function BlackGoldfFsh(props) {
  const group = React.useRef();
  const { scene, animations } = useGLTF(modelFile('black_goldfish.glb'));
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  const { actions } = useAnimations(animations, group);
  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Sketchfab_Scene">
        <primitive object={nodes._rootJoint} />
        <skinnedMesh
          name="Object_14"
          geometry={nodes.Object_14.geometry}
          material={materials.M_BroadtailMoor}
          skeleton={nodes.Object_14.skeleton}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={100}
        />
        <skinnedMesh
          name="Object_16"
          geometry={nodes.Object_16.geometry}
          material={materials.M_BroadtailMoor}
          skeleton={nodes.Object_16.skeleton}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={100}
        />
        <skinnedMesh
          name="Object_18"
          geometry={nodes.Object_18.geometry}
          material={materials.M_BroadtailMoor}
          skeleton={nodes.Object_18.skeleton}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={100}
        />
        <skinnedMesh
          name="Object_20"
          geometry={nodes.Object_20.geometry}
          material={materials.M_BroadtailMoor}
          skeleton={nodes.Object_20.skeleton}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={100}
        />
        <skinnedMesh
          name="Object_22"
          geometry={nodes.Object_22.geometry}
          material={materials.M_BroadtailMoor}
          skeleton={nodes.Object_22.skeleton}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={100}
        />
        <skinnedMesh
          name="Object_24"
          geometry={nodes.Object_24.geometry}
          material={materials.M_BroadtailMoor}
          skeleton={nodes.Object_24.skeleton}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={100}
        />
        <skinnedMesh
          name="Object_82"
          geometry={nodes.Object_82.geometry}
          material={materials.M_BroadtailMoor}
          skeleton={nodes.Object_82.skeleton}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={100}
        />
        <skinnedMesh
          name="Object_84"
          geometry={nodes.Object_84.geometry}
          material={materials.M_BroadtailMoor}
          skeleton={nodes.Object_84.skeleton}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={100}
        />
        <skinnedMesh
          name="Object_86"
          geometry={nodes.Object_86.geometry}
          material={materials.M_eyes}
          skeleton={nodes.Object_86.skeleton}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={100}
        />
        <skinnedMesh
          name="Object_88"
          geometry={nodes.Object_88.geometry}
          material={materials.M_eyes}
          skeleton={nodes.Object_88.skeleton}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={100}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('black_goldfish.glb'));
