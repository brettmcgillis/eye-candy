/* eslint-disable no-underscore-dangle */
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

import React, { useEffect, useMemo, useRef } from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { createPortal, useGraph } from '@react-three/fiber';

import { modelFile } from '../../../../../../utils/appUtils';
import Magnum from '../../../../../elements/magnum/Magnum';

const MODEL = modelFile('racoon.glb');
useGLTF.preload(MODEL);

const HAND_BONES = {
  right: 'RightHand_042',
  left: 'LeftHand_056',
};

// A single raccoon frozen (or playing) on a chosen clip. Poses authored in the
// GLTF Workbench are stored as single-frame animations, so by default we play the
// clip and pause it on frame 0 to use it as a static hero pose. Optionally holds
// the .44 magnum, parented to a hand bone so it tracks the pose.
export default function PosedRaccoon({
  pose,
  animate = false,
  holdsGun = false,
  gunHand = 'right',
  gunTransform,
  ...props
}) {
  const group = useRef();
  const { scene, animations } = useGLTF(MODEL);
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  // Clone the clips per instance — three.js keys action/binding caches by clip
  // uuid, so sharing the same AnimationClip objects across multiple raccoons makes
  // all but one freeze. (Same pattern as elements/tigerShark for its twin sharks.)
  const clonedAnimations = useMemo(
    () => animations.map((clip) => clip.clone()),
    [animations]
  );
  const { actions, mixer } = useAnimations(clonedAnimations, group);

  // A group we own and reparent under the chosen hand bone; the gun is portaled
  // into it so it inherits the bone's animated world transform.
  const gunMount = useMemo(() => new THREE.Group(), []);

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

  // Attach / detach the gun mount to the appropriate hand bone.
  useEffect(() => {
    if (!holdsGun) return undefined;
    const boneName = HAND_BONES[gunHand] || HAND_BONES.right;
    const bone = clone.getObjectByName(boneName);
    if (!bone) return undefined;
    bone.add(gunMount);
    return () => bone.remove(gunMount);
  }, [holdsGun, gunHand, clone, gunMount]);

  // Keep the gun mount's local transform in sync with the tuning controls.
  useEffect(() => {
    if (!gunTransform) return;
    const { scale, posX, posY, posZ, rotX, rotY, rotZ } = gunTransform;
    gunMount.position.set(posX, posY, posZ);
    gunMount.rotation.set(rotX, rotY, rotZ);
    gunMount.scale.setScalar(scale);
  }, [gunMount, gunTransform]);

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
      {holdsGun && createPortal(<Magnum />, gunMount)}
    </group>
  );
}
