/* eslint-disable no-underscore-dangle */
import { SkeletonUtils } from 'three-stdlib';

import React from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { modelFile } from '../../../utils/appUtils';

export default function SecurityCamera(props) {
  const group = React.useRef();
  const { scene, animations } = useGLTF(modelFile('security_camera.glb'));
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
          material={materials.Camera_map}
          skeleton={nodes.Object_7.skeleton}
          scale={0.01}
        />
        <skinnedMesh
          name="Object_8"
          geometry={nodes.Object_8.geometry}
          material={materials.Lens_map}
          skeleton={nodes.Object_8.skeleton}
          scale={0.01}
        />
        <skinnedMesh
          name="Object_10"
          geometry={nodes.Object_10.geometry}
          material={materials.Camera_map}
          skeleton={nodes.Object_10.skeleton}
          scale={0.01}
        />
        <skinnedMesh
          name="Object_12"
          geometry={nodes.Object_12.geometry}
          material={materials.Camera_map}
          skeleton={nodes.Object_12.skeleton}
          scale={0.01}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('security_camera.glb'));
