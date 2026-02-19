/* eslint-disable no-plusplus */

/* eslint-disable no-param-reassign */

/* eslint-disable no-unused-vars */

/* eslint-disable unused-imports/no-unused-vars */

/* eslint-disable react/no-array-index-key */
import * as THREE from 'three';

import React, { useEffect, useMemo, useRef } from 'react';

import {
  Center,
  Environment,
  Lightformer,
  PerspectiveCamera,
} from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, N8AO } from '@react-three/postprocessing';
import { BallCollider, Physics, RigidBody } from '@react-three/rapier';

import QuinnsD4 from '../../elements/quinnsDice/QuinnsD4';
import QuinnsD6 from '../../elements/quinnsDice/QuinnsD6';
import QuinnsD8 from '../../elements/quinnsDice/QuinnsD8';
import QuinnsD10 from '../../elements/quinnsDice/QuinnsD10';
import QuinnsD12 from '../../elements/quinnsDice/QuinnsD12';
import QuinnsD20 from '../../elements/quinnsDice/QuinnsD20';
import useQuinnsDiceControls from './useQuinnsDiceControls';

const dice = [
  {
    id: 'd4',
    Component: QuinnsD4,
    position: [-1.6, 1.1, 0],
  },
  {
    id: 'd6',
    Component: QuinnsD6,
    position: [-0.3, 1.25, 0],
  },
  {
    id: 'd8',
    Component: QuinnsD8,
    position: [1.1, 1.05, 0],
  },
  {
    id: 'd10',
    Component: QuinnsD10,
    position: [2, -0.05, 0],
  },
  {
    id: 'd12',
    Component: QuinnsD12,
    position: [-0.9, -1.1, 0],
  },
  {
    id: 'd20',
    Component: QuinnsD20,
    position: [0.7, -1.25, 0],
  },
];

export default function QuinnsDice() {
  const {
    debug,
    backgroundColor,
    returnStrength,
    maxImpulse,
    linearDamping,
    angularDamping,
    friction,
    targetX,
    targetY,
    targetZ,
    pointerRadius,
  } = useQuinnsDiceControls();

  return (
    <group>
      <SceneBackground color={backgroundColor} />
      <PerspectiveCamera
        makeDefault
        position={[0, 0, 22]}
        fov={24}
        near={1}
        far={200}
      />
      <ambientLight intensity={0.4} />
      <spotLight
        position={[10, 10, 10]}
        angle={0.15}
        penumbra={1}
        intensity={1}
        castShadow
      />
      <Physics gravity={[0, 0, 0]} debug={debug}>
        <Pointer radius={pointerRadius} />
        <D4Die
          returnStrength={returnStrength}
          maxImpulse={maxImpulse}
          linearDamping={linearDamping}
          angularDamping={angularDamping}
          friction={friction}
          target={[targetX, targetY, targetZ]}
        />
        <D6Die
          returnStrength={returnStrength}
          maxImpulse={maxImpulse}
          linearDamping={linearDamping}
          angularDamping={angularDamping}
          friction={friction}
          target={[targetX, targetY, targetZ]}
        />
        <D8Die
          returnStrength={returnStrength}
          maxImpulse={maxImpulse}
          linearDamping={linearDamping}
          angularDamping={angularDamping}
          friction={friction}
          target={[targetX, targetY, targetZ]}
        />
        <D10Die
          returnStrength={returnStrength}
          maxImpulse={maxImpulse}
          linearDamping={linearDamping}
          angularDamping={angularDamping}
          friction={friction}
          target={[targetX, targetY, targetZ]}
        />
        <D12Die
          returnStrength={returnStrength}
          maxImpulse={maxImpulse}
          linearDamping={linearDamping}
          angularDamping={angularDamping}
          friction={friction}
          target={[targetX, targetY, targetZ]}
        />
        <D20Die
          returnStrength={returnStrength}
          maxImpulse={maxImpulse}
          linearDamping={linearDamping}
          angularDamping={angularDamping}
          friction={friction}
          target={[targetX, targetY, targetZ]}
        />
      </Physics>
      <EffectComposer disableNormalPass multisampling={8}>
        <N8AO distanceFalloff={1} aoRadius={1} intensity={4} />
      </EffectComposer>
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer
            form="circle"
            intensity={4}
            rotation-x={Math.PI / 2}
            position={[0, 5, -9]}
            scale={2}
          />
          <Lightformer
            form="circle"
            intensity={2}
            rotation-y={Math.PI / 2}
            position={[-5, 1, -1]}
            scale={2}
          />
          <Lightformer
            form="circle"
            intensity={2}
            rotation-y={Math.PI / 2}
            position={[-5, -1, -1]}
            scale={2}
          />
          <Lightformer
            form="circle"
            intensity={2}
            rotation-y={-Math.PI / 2}
            position={[10, 1, 0]}
            scale={8}
          />
        </group>
      </Environment>
    </group>
  );
}

function SceneBackground({ color }) {
  const { gl, scene } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color(color);
    gl.setClearColor(color);
  }, [color, gl, scene]);

  return null;
}

function DieBody({
  position,
  children,
  vec = new THREE.Vector3(),
  r = THREE.MathUtils.randFloatSpread,
  returnStrength = 0.2,
  maxImpulse = 0.5,
  linearDamping = 4,
  angularDamping = 1,
  friction = 0.1,
  target = [0, 0, 0],
  colliders = false,
}) {
  const api = useRef();
  const pos = useMemo(() => position || [r(10), r(10), r(10)], []);
  useFrame((_, delta) => {
    const body = api.current;
    if (!body) return;
    delta = Math.min(0.1, delta);
    const translation = body.translation();
    vec
      .set(target[0], target[1], target[2])
      .sub(translation)
      .multiplyScalar(returnStrength * delta * 60)
      .clampLength(0, maxImpulse);
    body.applyImpulse(vec);
  });
  return (
    <RigidBody
      linearDamping={linearDamping}
      angularDamping={angularDamping}
      friction={friction}
      position={pos}
      ref={api}
      colliders={colliders}
      canSleep={false}
      ccd
    >
      {children}
    </RigidBody>
  );
}

function D4Die(props) {
  const { position } = dice[0];
  return (
    <DieBody position={position} {...props}>
      <BallCollider args={[0.9]} />
      <Center>
        <QuinnsD4 />
      </Center>
    </DieBody>
  );
}

function D6Die(props) {
  const { position } = dice[1];
  return (
    <DieBody position={position} {...props}>
      <BallCollider args={[0.9]} />
      <Center>
        <QuinnsD6 />
      </Center>
    </DieBody>
  );
}

function D8Die(props) {
  const { position } = dice[2];
  return (
    <DieBody position={position} {...props}>
      <BallCollider args={[0.9]} />
      <Center>
        <QuinnsD8 />
      </Center>
    </DieBody>
  );
}

function D10Die(props) {
  const { position } = dice[3];
  return (
    <DieBody position={position} {...props}>
      <BallCollider args={[1]} />
      <Center>
        <QuinnsD10 />
      </Center>
    </DieBody>
  );
}

function D12Die(props) {
  const { position } = dice[4];
  return (
    <DieBody position={position} {...props}>
      <BallCollider args={[1]} />
      <Center>
        <QuinnsD12 />
      </Center>
    </DieBody>
  );
}

function D20Die(props) {
  const { position } = dice[5];
  return (
    <DieBody position={position} {...props}>
      <BallCollider args={[1]} />
      <Center>
        <QuinnsD20 />
      </Center>
    </DieBody>
  );
}

function Pointer({ radius = 1, vec = new THREE.Vector3() }) {
  const ref = useRef();
  useFrame(({ mouse, viewport }) => {
    ref.current?.setNextKinematicTranslation(
      vec.set(
        (mouse.x * viewport.width) / 2,
        (mouse.y * viewport.height) / 2,
        0
      )
    );
  });
  return (
    <RigidBody
      position={[0, 0, 0]}
      type="kinematicPosition"
      colliders={false}
      ref={ref}
      ccd
    >
      <BallCollider args={[radius]} />
    </RigidBody>
  );
}
