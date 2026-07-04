import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

import React from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { modelFile } from '../../../utils/appUtils';

export default function Bee2({
  animationOffset = 0,
  animationSpeed = 1,
  ...props
}) {
  const group = React.useRef();
  const { scene, animations } = useGLTF(modelFile('bee2.glb'));
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  const { actions } = useAnimations(animations, group);

  React.useEffect(() => {
    const names = Object.keys(actions || {});
    if (!names.length) {
      return undefined;
    }

    const action = actions[names[0]];
    if (!action) {
      return undefined;
    }

    action.enabled = true;
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.reset();
    action.play();
    action.timeScale = animationSpeed;

    if (Number.isFinite(animationOffset) && action.getClip()?.duration > 0) {
      const duration = action.getClip().duration;
      action.time = ((animationOffset % duration) + duration) % duration;
    }

    return () => {
      action.stop();
    };
  }, [actions, animationOffset, animationSpeed]);

  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Scene">
        <group name="GLTF_created_0" scale={0.01}>
          <primitive object={nodes.GLTF_created_0_rootJoint} />
        </group>
        <skinnedMesh
          name="Object_116"
          geometry={nodes.Object_116.geometry}
          material={materials.Material}
          skeleton={nodes.Object_116.skeleton}
          scale={0.01}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('bee2.glb'));
