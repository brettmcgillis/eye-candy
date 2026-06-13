import { SkeletonUtils } from 'three-stdlib';

import React from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { modelFile } from '../../../utils/appUtils';

export default function KingFisher(props) {
  const group = React.useRef();
  const { scene, animations } = useGLTF(modelFile('KingFisher.glb'));
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  const { actions } = useAnimations(animations, group);
  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Sketchfab_Scene">
        <primitive object={nodes.GLTF_created_0_rootJoint} />
        <skinnedMesh
          name="Object_566"
          geometry={nodes.Object_566.geometry}
          material={materials.body}
          skeleton={nodes.Object_566.skeleton}
          scale={0.145}
        />
        <skinnedMesh
          name="Object_569"
          geometry={nodes.Object_569.geometry}
          material={materials.body}
          skeleton={nodes.Object_569.skeleton}
          scale={0.145}
        />
        <skinnedMesh
          name="Object_572"
          geometry={nodes.Object_572.geometry}
          material={materials.body}
          skeleton={nodes.Object_572.skeleton}
          scale={0.145}
        />
        <skinnedMesh
          name="Object_575"
          geometry={nodes.Object_575.geometry}
          material={materials.body}
          skeleton={nodes.Object_575.skeleton}
          scale={0.145}
        />
        <skinnedMesh
          name="Object_578"
          geometry={nodes.Object_578.geometry}
          material={materials.body}
          skeleton={nodes.Object_578.skeleton}
          scale={0.145}
        />
        <skinnedMesh
          name="Object_581"
          geometry={nodes.Object_581.geometry}
          material={materials.body}
          skeleton={nodes.Object_581.skeleton}
          scale={0.145}
        />
        <skinnedMesh
          name="Object_584"
          geometry={nodes.Object_584.geometry}
          material={materials.body}
          skeleton={nodes.Object_584.skeleton}
          scale={0.145}
        />
        <skinnedMesh
          name="Object_587"
          geometry={nodes.Object_587.geometry}
          material={materials.body}
          skeleton={nodes.Object_587.skeleton}
          scale={0.145}
        />
        <skinnedMesh
          name="Object_590"
          geometry={nodes.Object_590.geometry}
          material={materials.body}
          skeleton={nodes.Object_590.skeleton}
          scale={0.145}
        />
        <skinnedMesh
          name="Object_593"
          geometry={nodes.Object_593.geometry}
          material={materials.body}
          skeleton={nodes.Object_593.skeleton}
          scale={0.145}
        />
        <skinnedMesh
          name="Object_596"
          geometry={nodes.Object_596.geometry}
          material={materials.body}
          skeleton={nodes.Object_596.skeleton}
          scale={0.145}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('KingFisher.glb'));
