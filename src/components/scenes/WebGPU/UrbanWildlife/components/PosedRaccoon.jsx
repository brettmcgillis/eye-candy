/* eslint-disable no-underscore-dangle */
import React, { useEffect, useMemo, useRef } from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { createPortal, useGraph } from '@react-three/fiber';

import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

import BowieKnife from '@elements/BowieKnife/BowieKnife';
import Magnum from '@elements/magnum/Magnum';
import { modelFile } from '@utils/appUtils';

const MODEL = modelFile('racoon.glb');
useGLTF.preload(MODEL);

// Hand bones live in the flattened `nodes` graph from useGraph (they're mounted at
// render time via <primitive object={nodes._rootJoint} />), NOT under the cloned
// scene root — so look them up by name in `nodes`.
const HAND_BONES = {
  right: 'RightHand_042',
  left: 'LeftHand_056',
};

// A single raccoon frozen (or playing) on a chosen clip. Poses authored in the
// GLTF Workbench are stored as single-frame animations, so by default we play the
// clip and pause it on frame 0 to use it as a static hero pose. Optionally holds
// a weapon ('gun' | 'knife'), parented to a hand bone so it tracks the pose.
export default function PosedRaccoon({
  pose,
  animate = false,
  weapon = 'none',
  weaponHand = 'right',
  gunTransform,
  knifeTransform,
  ...props
}) {
  const holdsWeapon = weapon === 'gun' || weapon === 'knife';
  const weaponTransform = weapon === 'knife' ? knifeTransform : gunTransform;
  const group = useRef();
  const { scene, animations } = useGLTF(MODEL);
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  // Clone the clips per instance — three.js keys action/binding caches by clip
  // uuid, so sharing the same AnimationClip objects across multiple raccoons makes
  // all but one freeze. (Same pattern as elements/tigerShark for its twin sharks.)
  const clonedAnimations = useMemo(
    () =>
      animations.map((clip) => {
        const cloned = clip.clone();
        // Single-frame hero poses (e.g. *-singleFrame) have one keyframe, so the
        // clip resolves to duration 0. A zero-length clip makes the mixer's loop
        // math divide by zero → NaN time → the pose never applies and the raccoon
        // snaps back to its bind pose. Give it a tiny duration; the lone keyframe
        // still samples to the same constant pose.
        if (cloned.duration <= 0) cloned.duration = 1 / 30;
        return cloned;
      }),
    [animations]
  );
  const { actions, mixer } = useAnimations(clonedAnimations, group);

  // A group we own and reparent under the chosen hand bone; the weapon is portaled
  // into it so it inherits the bone's animated world transform.
  const weaponMount = useMemo(() => new THREE.Group(), []);

  useEffect(() => {
    const action = pose ? actions[pose] : null;
    if (!action) return undefined;
    mixer.stopAllAction();
    action.reset().play();
    if (!animate) {
      action.paused = true;
      action.time = 0;
      mixer.update(0);
    }
    return () => action.stop();
  }, [actions, pose, animate, mixer]);

  // Attach / detach the weapon mount to the appropriate hand bone.
  useEffect(() => {
    if (!holdsWeapon) return undefined;
    const bone = nodes[HAND_BONES[weaponHand]] || nodes[HAND_BONES.right];
    if (!bone) return undefined;
    bone.add(weaponMount);
    return () => bone.remove(weaponMount);
  }, [holdsWeapon, weaponHand, nodes, weaponMount]);

  // Keep the weapon mount's local transform in sync with the tuning controls.
  useEffect(() => {
    if (!weaponTransform) return;
    const { scale, posX, posY, posZ, rotX, rotY, rotZ } = weaponTransform;
    weaponMount.position.set(posX, posY, posZ);
    weaponMount.rotation.set(rotX, rotY, rotZ);
    weaponMount.scale.setScalar(scale);
  }, [weaponMount, weaponTransform]);

  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Sketchfab_Scene">
        <primitive object={nodes._rootJoint} />
        <skinnedMesh
          name="Object_9"
          geometry={nodes.Object_9.geometry}
          material={materials.Raccoon_Body}
          skeleton={nodes.Object_9.skeleton}
          rotation={[-Math.PI / 2, 0, 0]}
          castShadow
          receiveShadow
        />
        <skinnedMesh
          name="Object_10"
          geometry={nodes.Object_10.geometry}
          material={materials.Mexican_Bobcat_Cards}
          skeleton={nodes.Object_10.skeleton}
          rotation={[-Math.PI / 2, 0, 0]}
          castShadow
          receiveShadow
        />
      </group>
      {weapon === 'gun' && createPortal(<Magnum />, weaponMount)}
      {weapon === 'knife' && createPortal(<BowieKnife />, weaponMount)}
    </group>
  );
}
