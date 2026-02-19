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
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, N8AO } from '@react-three/postprocessing';
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
} from '@react-three/rapier';

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
const mainLightPosition = [10, 10, 10];
const mainLightTarget = [0, 0, 0];
const lightformerConfigs = [
  {
    position: [0, 5, -9],
    rotation: [Math.PI / 2, 0, 0],
    intensity: 4,
    scale: 2,
  },
  {
    position: [-5, 1, -1],
    rotation: [0, Math.PI / 2, 0],
    intensity: 2,
    scale: 2,
  },
  {
    position: [-5, -1, -1],
    rotation: [0, Math.PI / 2, 0],
    intensity: 2,
    scale: 2,
  },
  {
    position: [10, 1, 0],
    rotation: [0, -Math.PI / 2, 0],
    intensity: 2,
    scale: 8,
  },
];

export default function QuinnsDice() {
  const {
    debug,
    debugLights,
    orbitControlsEnabled,
    backgroundTopColor,
    backgroundBottomColor,
    returnStrength,
    maxImpulse,
    linearDamping,
    angularDamping,
    friction,
    boxWidth,
    boxHeight,
    boxDepth,
    targetX,
    targetY,
    targetZ,
    pointerRadius,
  } = useQuinnsDiceControls();

  return (
    <group>
      <SceneBackground
        topColor={backgroundTopColor}
        bottomColor={backgroundBottomColor}
      />
      <PerspectiveCamera
        makeDefault
        position={[0, 0, 22]}
        fov={24}
        near={1}
        far={200}
      />
      {orbitControlsEnabled && (
        <OrbitControls enableDamping dampingFactor={0.08} />
      )}
      <ambientLight intensity={0.4} />
      <spotLight
        position={mainLightPosition}
        target-position={mainLightTarget}
        angle={0.15}
        penumbra={1}
        intensity={1}
        castShadow
      />
      {debugLights && (
        <LightDebugPyramid
          position={mainLightPosition}
          target={mainLightTarget}
        />
      )}
      <Physics gravity={[0, 0, 0]} debug={debug}>
        <SceneBounds width={boxWidth} height={boxHeight} depth={boxDepth} />
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
          {lightformerConfigs.map((config, index) => (
            <Lightformer
              key={`lf-${index}`}
              form="circle"
              intensity={config.intensity}
              position={config.position}
              rotation={config.rotation}
              scale={config.scale}
            />
          ))}
        </group>
      </Environment>
      {debugLights && (
        <group rotation={[-Math.PI / 3, 0, 1]}>
          {lightformerConfigs.map((config, index) => (
            <LightformerDebugPyramid
              key={`lf-debug-${index}`}
              position={config.position}
              rotation={config.rotation}
            />
          ))}
        </group>
      )}
    </group>
  );
}

function SceneBackground({ topColor, bottomColor }) {
  const { gl, scene } = useThree();
  const textureRef = useRef();

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, bottomColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const nextTexture = new THREE.CanvasTexture(canvas);
    nextTexture.colorSpace = THREE.SRGBColorSpace;
    nextTexture.minFilter = THREE.LinearFilter;
    nextTexture.magFilter = THREE.LinearFilter;

    const prevTexture = textureRef.current;
    textureRef.current = nextTexture;
    scene.background = nextTexture;
    gl.setClearColor(bottomColor);

    if (prevTexture) prevTexture.dispose();
  }, [topColor, bottomColor, gl, scene]);

  useEffect(
    () => () => {
      if (textureRef.current) textureRef.current.dispose();
      scene.background = null;
    },
    [scene]
  );

  return null;
}

function LightDebugPyramid({ position, target }) {
  const quaternion = useMemo(() => {
    const source = new THREE.Vector3(0, -1, 0);
    const direction = new THREE.Vector3()
      .subVectors(new THREE.Vector3(...target), new THREE.Vector3(...position))
      .normalize();
    return new THREE.Quaternion().setFromUnitVectors(source, direction);
  }, [position, target]);

  return (
    <mesh position={position} quaternion={quaternion}>
      <coneGeometry args={[0.35, 0.8, 4, 1]} />
      <meshBasicMaterial color="#ff0000" wireframe />
    </mesh>
  );
}

function LightformerDebugPyramid({ position, rotation }) {
  return (
    <mesh position={position} rotation={rotation}>
      <coneGeometry args={[0.25, 0.6, 4, 1]} />
      <meshBasicMaterial color="#00ff00" wireframe />
    </mesh>
  );
}

function SceneBounds({ width = 30, height = 30, depth = 30 }) {
  const halfW = width / 2;
  const halfH = height / 2;
  const halfD = depth / 2;
  const wallThickness = 0.25;

  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider
        args={[halfW, wallThickness, halfD]}
        position={[0, halfH, 0]}
      />
      <CuboidCollider
        args={[halfW, wallThickness, halfD]}
        position={[0, -halfH, 0]}
      />
      <CuboidCollider
        args={[wallThickness, halfH, halfD]}
        position={[halfW, 0, 0]}
      />
      <CuboidCollider
        args={[wallThickness, halfH, halfD]}
        position={[-halfW, 0, 0]}
      />
      <CuboidCollider
        args={[halfW, halfH, wallThickness]}
        position={[0, 0, halfD]}
      />
      <CuboidCollider
        args={[halfW, halfH, wallThickness]}
        position={[0, 0, -halfD]}
      />
    </RigidBody>
  );
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
  const { gl } = useThree();
  const ref = useRef();
  const hasMovedRef = useRef(false);

  useEffect(() => {
    const onPointerMove = () => {
      hasMovedRef.current = true;
    };
    gl.domElement.addEventListener('pointermove', onPointerMove);
    return () =>
      gl.domElement.removeEventListener('pointermove', onPointerMove);
  }, [gl]);

  useFrame(({ mouse, viewport }) => {
    const body = ref.current;
    if (!body) return;

    // Keep pointer away from dice until we get real mouse movement.
    if (!hasMovedRef.current) {
      body.setNextKinematicTranslation(vec.set(999, 999, 999));
      return;
    }
    body.setNextKinematicTranslation(
      vec.set(
        (mouse.x * viewport.width) / 2,
        (mouse.y * viewport.height) / 2,
        0
      )
    );
  });
  return (
    <RigidBody
      position={[999, 999, 999]}
      type="kinematicPosition"
      colliders={false}
      ref={ref}
      ccd
    >
      <BallCollider args={[radius]} />
    </RigidBody>
  );
}
