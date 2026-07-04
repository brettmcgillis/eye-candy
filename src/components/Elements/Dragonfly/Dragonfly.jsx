import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

import React from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { modelFile } from '../../../utils/appUtils';

export default function Dragonfly({
  animationOffset = 0,
  animationSpeed = 1,
  ...props
}) {
  const group = React.useRef();
  const { scene, animations } = useGLTF(modelFile('dragonfly.glb'));
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
      <group name="Sketchfab_Scene">
        <primitive object={nodes.GLTF_created_0_rootJoint} />
        <skinnedMesh
          name="Object_65"
          geometry={nodes.Object_65.geometry}
          material={materials.claws}
          skeleton={nodes.Object_65.skeleton}
          position={[0, 0.03, 0.002]}
          rotation={[1.631, 0, 0]}
          scale={1.967}
        />
        <skinnedMesh
          name="Object_68"
          geometry={nodes.Object_68.geometry}
          material={materials.hair}
          skeleton={nodes.Object_68.skeleton}
          position={[0, 0.03, 0.002]}
          rotation={[1.631, 0, 0]}
          scale={1.967}
        />
        <skinnedMesh
          name="Object_71"
          geometry={nodes.Object_71.geometry}
          material={materials.wings}
          skeleton={nodes.Object_71.skeleton}
          position={[0, 0.03, 0.002]}
          rotation={[1.631, 0, 0]}
          scale={1.967}
        />
        <skinnedMesh
          name="Object_74"
          geometry={nodes.Object_74.geometry}
          material={materials.material}
          skeleton={nodes.Object_74.skeleton}
          position={[0, 0.03, 0.002]}
          rotation={[1.631, 0, 0]}
          scale={1.967}
        />
        <skinnedMesh
          name="Object_77"
          geometry={nodes.Object_77.geometry}
          material={materials.skin}
          skeleton={nodes.Object_77.skeleton}
          position={[0, 0.03, 0.002]}
          rotation={[1.631, 0, 0]}
          scale={1.967}
        />
        <skinnedMesh
          name="Object_80"
          geometry={nodes.Object_80.geometry}
          material={materials.sting}
          skeleton={nodes.Object_80.skeleton}
          position={[0, 0.03, 0.002]}
          rotation={[1.631, 0, 0]}
          scale={1.967}
        />
        <skinnedMesh
          name="Object_83"
          geometry={nodes.Object_83.geometry}
          material={materials.appendage}
          skeleton={nodes.Object_83.skeleton}
          position={[0, 0.03, 0.002]}
          rotation={[1.631, 0, 0]}
          scale={1.967}
        />
        <skinnedMesh
          name="Object_86"
          geometry={nodes.Object_86.geometry}
          material={materials.antennae}
          skeleton={nodes.Object_86.skeleton}
          position={[0, 0.03, 0.002]}
          rotation={[1.631, 0, 0]}
          scale={1.967}
        />
        <skinnedMesh
          name="Object_89"
          geometry={nodes.Object_89.geometry}
          material={materials.eyes}
          skeleton={nodes.Object_89.skeleton}
          position={[0, 0.03, 0.002]}
          rotation={[1.631, 0, 0]}
          scale={1.967}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('dragonfly.glb'));
