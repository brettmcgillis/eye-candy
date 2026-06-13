import { SkeletonUtils } from 'three-stdlib';

import React from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { modelFile } from '../../../utils/appUtils';

export default function Kingfisher(props) {
  const group = React.useRef();
  const { scene, animations } = useGLTF(modelFile('kingfisher.glb'));
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  const { actions } = useAnimations(animations, group);
  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Sketchfab_Scene">
        <primitive object={nodes.GLTF_created_0_rootJoint} />
        <skinnedMesh
          name="Object_571"
          geometry={nodes.Object_571.geometry}
          material={materials.body}
          skeleton={nodes.Object_571.skeleton}
          scale={0.143}
        />
        <skinnedMesh
          name="Object_574"
          geometry={nodes.Object_574.geometry}
          material={materials.body}
          skeleton={nodes.Object_574.skeleton}
          scale={0.143}
        />
        <skinnedMesh
          name="Object_577"
          geometry={nodes.Object_577.geometry}
          material={materials.body}
          skeleton={nodes.Object_577.skeleton}
          scale={0.143}
        />
        <skinnedMesh
          name="Object_580"
          geometry={nodes.Object_580.geometry}
          material={materials.body}
          skeleton={nodes.Object_580.skeleton}
          scale={0.143}
        />
        <skinnedMesh
          name="Object_583"
          geometry={nodes.Object_583.geometry}
          material={materials.body}
          skeleton={nodes.Object_583.skeleton}
          scale={0.143}
        />
        <skinnedMesh
          name="Object_586"
          geometry={nodes.Object_586.geometry}
          material={materials.body}
          skeleton={nodes.Object_586.skeleton}
          scale={0.143}
        />
        <skinnedMesh
          name="Object_589"
          geometry={nodes.Object_589.geometry}
          material={materials.body}
          skeleton={nodes.Object_589.skeleton}
          scale={0.143}
        />
        <skinnedMesh
          name="Object_592"
          geometry={nodes.Object_592.geometry}
          material={materials.body}
          skeleton={nodes.Object_592.skeleton}
          scale={0.143}
        />
        <skinnedMesh
          name="Object_595"
          geometry={nodes.Object_595.geometry}
          material={materials.body}
          skeleton={nodes.Object_595.skeleton}
          scale={0.143}
        />
        <skinnedMesh
          name="Object_598"
          geometry={nodes.Object_598.geometry}
          material={materials.body}
          skeleton={nodes.Object_598.skeleton}
          scale={0.143}
        />
        <skinnedMesh
          name="Object_601"
          geometry={nodes.Object_601.geometry}
          material={materials.body}
          skeleton={nodes.Object_601.skeleton}
          scale={0.143}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('kingfisher.glb'));
