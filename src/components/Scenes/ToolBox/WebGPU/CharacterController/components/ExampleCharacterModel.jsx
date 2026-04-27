/* eslint-disable consistent-return */

/* eslint-disable no-underscore-dangle */
import { useControls } from 'leva';
import * as THREE from 'three';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';

import {
  SpriteAnimator,
  Trail,
  useAnimations,
  useGLTF,
  useSpriteLoader,
  useTexture,
} from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { BallCollider, vec3 } from '@react-three/rapier';

import { modelFile, textureFile } from '../../../../../../utils/appUtils';
import { useGame } from '../../../../../ecctrl/stores/useGame';

const animationSet = {
  idle: 'Idle',
  walk: 'Walk',
  run: 'Run',
  jump: 'Jump_Start',
  jumpIdle: 'Jump_Idle',
  jumpLand: 'Jump_Land',
  fall: 'Climbing',
  action1: 'Wave',
  action2: 'Dance',
  action3: 'Cheer',
  action4: 'Attack(1h)',
};

// Animations available:
// (33)[
//   ('Attack(1h)',
//   'AttackCombo',
//   'AttackSpinning',
//   'BasePose',
//   'Block',
//   'Cheer',
//   'Climbing',
//   'Dance',
//   'DashBack',
//   'DashFront',
//   'DashLeft',
//   'DashRight',
//   'Defeat',
//   'HeavyAttack',
//   'Hop',
//   'Idle',
//   'Interact',
//   'Jump_Idle',
//   'Jump',
//   'Jump_Land',
//   'Jump_Start',
//   'LayingDownIdle',
//   'PickUp',
//   'Roll',
//   'Run',
//   'Shoot(1h)',
//   'Shoot(2h)',
//   'Shoot(2h)Bow',
//   'Shooting(1h)',
//   'Shooting(2h)',
//   'Throw',
//   'Walk',
//   'Wave')
// ];

export default function ExampleCharacterModel(props) {
  const group = useRef();
  const rightHandRef = useRef();
  const rightHandColliderRef = useRef();
  const leftHandRef = useRef();
  const leftHandColliderRef = useRef();
  const rightHandBoneRef = useRef(null);
  const mugModelRef = useRef(null);

  const { nodes, animations } = useGLTF(modelFile('/Floating Character.glb'));
  const { actions } = useAnimations(animations, group);

  const gradientMapTexture = useTexture('./textures/3.jpg');
  gradientMapTexture.minFilter = THREE.NearestFilter;
  gradientMapTexture.magFilter = THREE.NearestFilter;
  gradientMapTexture.generateMipmaps = false;

  const rightHandPos = useMemo(() => new THREE.Vector3(), []);
  const bodyPos = useMemo(() => new THREE.Vector3(), []);
  const bodyRot = useMemo(() => new THREE.Quaternion(), []);

  const { spriteObj } = useSpriteLoader(
    textureFile('/punchEffect.png'),
    null,
    null,
    7
  );
  const [punchEffectProps, setPunchEffectProp] = useState({
    visible: false,
    scale: [1, 1, 1],
    play: false,
    position: [-0.2, -0.2, 0.5],
    startFrame: 0,
  });

  const { mainColor, outlineColor, trailColor } = useControls(
    'Character Model',
    {
      mainColor: 'mediumslateblue',
      outlineColor: 'black',
      trailColor: 'violet',
    }
  );

  const outlineMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: outlineColor,
        transparent: true,
      }),
    [outlineColor]
  );

  const meshToonMaterial = useMemo(
    () =>
      new THREE.MeshToonMaterial({
        color: mainColor,
        gradientMap: gradientMapTexture,
        transparent: true,
      }),
    [mainColor, gradientMapTexture]
  );

  const curAnimation = useGame((state) => state.curAnimation);
  const resetAnimation = useGame((state) => state.reset);
  const initializeAnimationSet = useGame(
    (state) => state.initializeAnimationSet
  );

  useEffect(() => {
    initializeAnimationSet(animationSet);
  }, [initializeAnimationSet]);

  useEffect(() => {
    if (!group.current) return;

    group.current.traverse((obj) => {
      if (obj instanceof THREE.Bone && obj.name === 'handSlotRight') {
        rightHandBoneRef.current = obj;
      }

      if (obj.name === 'mug') {
        mugModelRef.current = obj;
        mugModelRef.current.visible = false;
      }
    });
  }, []);

  useFrame(() => {
    if (curAnimation !== animationSet.action4) return;

    const rightHandBone = rightHandBoneRef.current;
    if (rightHandBone) {
      rightHandBone.getWorldPosition(rightHandPos);
      group.current.getWorldPosition(bodyPos);
      group.current.getWorldQuaternion(bodyRot);
    }

    if (!rightHandColliderRef.current) return;

    if (
      group.current.parent.quaternion.y === 0 &&
      group.current.parent.quaternion.w === 1
    ) {
      rightHandRef.current.position
        .copy(rightHandPos)
        .sub(bodyPos)
        .applyQuaternion(bodyRot.clone().conjugate());
    } else {
      rightHandRef.current.position.copy(rightHandPos).sub(bodyPos);
    }

    rightHandColliderRef.current.setTranslationWrtParent(
      rightHandRef.current.position
    );
  });

  useEffect(() => {
    // Animations might not be loaded yet
    const actionKeys = Object.keys(actions);
    if (!actionKeys.length) return;

    // Resolve animation key to name (e.g., 'action4' -> 'Attack(1h)')
    const animationName = animationSet[curAnimation] || curAnimation;
    // Default to idle if no animation is set
    const animationToPlay = animationName || animationSet.idle;
    const action = actions[animationToPlay];
    if (!action) {
      console.warn(
        `Animation "${animationToPlay}" not found. Available:`,
        actionKeys
      );
      return;
    }

    console.log('Playing animation:', animationToPlay);

    if (
      animationToPlay === animationSet.jump ||
      animationToPlay === animationSet.jumpLand ||
      animationToPlay === animationSet.action1 ||
      animationToPlay === animationSet.action2 ||
      animationToPlay === animationSet.action3 ||
      animationToPlay === animationSet.action4
    ) {
      action.reset().fadeIn(0.2).setLoop(THREE.LoopOnce, undefined).play();
      action.clampWhenFinished = true;
      if (mugModelRef.current) {
        mugModelRef.current.visible = animationToPlay === animationSet.action3;
      }
    } else {
      action.reset().fadeIn(0.2).play();
      if (mugModelRef.current) mugModelRef.current.visible = false;
    }

    action._mixer.addEventListener('finished', () => resetAnimation());

    return () => {
      if (!action) return;
      action.fadeOut(0.2);
      action._mixer.removeEventListener('finished', () => resetAnimation());
      action._mixer._listeners = [];

      if (animationToPlay === animationSet.action4) {
        if (rightHandColliderRef.current) {
          rightHandColliderRef.current.setTranslationWrtParent(
            vec3({ x: 0, y: 0, z: 0 })
          );
        }
      }
    };
  }, [actions, curAnimation, resetAnimation, animationSet]);

  return (
    <Suspense fallback={<capsuleGeometry args={[0.3, 0.7]} />}>
      <BallCollider args={[0.5]} position={[0, 0.45, 0]} />

      <group ref={rightHandRef} />
      <BallCollider
        args={[0.1]}
        ref={rightHandColliderRef}
        onCollisionEnter={() => {
          if (curAnimation === animationSet.action4) {
            setPunchEffectProp((prev) => ({
              ...prev,
              visible: true,
              play: true,
            }));
          }
        }}
      />

      <group ref={leftHandRef} />
      <BallCollider args={[0.1]} ref={leftHandColliderRef} />

      <group ref={group} {...props} dispose={null}>
        <group name="Scene" scale={0.8} position={[0, -0.6, 0]}>
          <group name="KayKit_Animated_Character">
            <skinnedMesh
              name="outline"
              geometry={nodes.outline.geometry}
              material={outlineMaterial}
              skeleton={nodes.outline.skeleton}
            />
            <skinnedMesh
              name="PrototypePete"
              geometry={nodes.PrototypePete.geometry}
              material={meshToonMaterial}
              skeleton={nodes.PrototypePete.skeleton}
              receiveShadow
              castShadow
            />
            <Trail
              width={1.5}
              color={trailColor}
              length={1.5}
              attenuation={(width) => width}
            >
              <primitive object={nodes.Body} />
            </Trail>
          </group>
        </group>

        <SpriteAnimator
          visible={punchEffectProps.visible}
          scale={punchEffectProps.scale}
          position={punchEffectProps.position}
          startFrame={punchEffectProps.startFrame}
          loop
          onLoopEnd={() => {
            setPunchEffectProp((prev) => ({
              ...prev,
              visible: false,
              play: false,
            }));
          }}
          play={punchEffectProps.play}
          numberOfFrames={7}
          alphaTest={0.01}
          asSprite
          spriteDataset={spriteObj}
        />
      </group>
    </Suspense>
  );
}

useGLTF.preload(modelFile('/Floating Character.glb'));
