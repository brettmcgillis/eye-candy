/* eslint-disable no-underscore-dangle */
import { SkeletonUtils } from 'three-stdlib';

import React from 'react';

import { useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { modelFile } from '../../../utils/appUtils';

export default function FemaleSkeleton(props) {
  const { scene } = useGLTF(modelFile('female_skeleton.glb'));
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  return (
    <group {...props} dispose={null}>
      <primitive object={nodes._rootJoint} />
      <skinnedMesh
        geometry={nodes.Object_6.geometry}
        material={materials.ArmsHands}
        skeleton={nodes.Object_6.skeleton}
        scale={0.01}
      />
      <skinnedMesh
        geometry={nodes.Object_7.geometry}
        material={materials.HipsLegs}
        skeleton={nodes.Object_7.skeleton}
        scale={0.01}
      />
      <skinnedMesh
        geometry={nodes.Object_8.geometry}
        material={materials.HipsLegs}
        skeleton={nodes.Object_8.skeleton}
        scale={0.01}
      />
      <skinnedMesh
        geometry={nodes.Object_9.geometry}
        material={materials.HipsLegs}
        skeleton={nodes.Object_9.skeleton}
        scale={0.01}
      />
      <skinnedMesh
        geometry={nodes.Object_10.geometry}
        material={materials.Discs}
        skeleton={nodes.Object_10.skeleton}
        scale={0.01}
      />
      <skinnedMesh
        geometry={nodes.Object_11.geometry}
        material={materials.Discs}
        skeleton={nodes.Object_11.skeleton}
        scale={0.01}
      />
      <skinnedMesh
        geometry={nodes.Object_12.geometry}
        material={materials.Discs}
        skeleton={nodes.Object_12.skeleton}
        scale={0.01}
      />
      <skinnedMesh
        geometry={nodes.Object_13.geometry}
        material={materials.Discs}
        skeleton={nodes.Object_13.skeleton}
        scale={0.01}
      />
      <skinnedMesh
        geometry={nodes.Object_14.geometry}
        material={materials.Discs}
        skeleton={nodes.Object_14.skeleton}
        scale={0.01}
      />
      <skinnedMesh
        geometry={nodes.Object_15.geometry}
        material={materials.Discs}
        skeleton={nodes.Object_15.skeleton}
        scale={0.01}
      />
      <skinnedMesh
        geometry={nodes.Object_16.geometry}
        material={materials.Cranium}
        skeleton={nodes.Object_16.skeleton}
        scale={0.01}
      />
      <skinnedMesh
        geometry={nodes.Object_17.geometry}
        material={materials.UpperTeeth}
        skeleton={nodes.Object_17.skeleton}
        scale={0.01}
      />
      <skinnedMesh
        geometry={nodes.Object_18.geometry}
        material={materials.Cranium}
        skeleton={nodes.Object_18.skeleton}
        scale={0.01}
      />
      <skinnedMesh
        geometry={nodes.Object_19.geometry}
        material={materials.UpperTeeth}
        skeleton={nodes.Object_19.skeleton}
        scale={0.01}
      />
    </group>
  );
}

useGLTF.preload(modelFile('female_skeleton.glb'));
