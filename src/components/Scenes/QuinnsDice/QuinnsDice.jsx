/* eslint-disable no-nested-ternary */

/* eslint-disable no-plusplus */

/* eslint-disable no-param-reassign */

/* eslint-disable no-unused-vars */

/* eslint-disable unused-imports/no-unused-vars */

/* eslint-disable react/no-array-index-key */
import * as THREE from 'three';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Center,
  Environment,
  Lightformer,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, N8AO } from '@react-three/postprocessing';
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  RoundCuboidCollider,
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
const RESET_GRID_POSITIONS = [
  [-2, 1.8, 0],
  [0, 1.8, 0],
  [2, 1.8, 0],
  [-2, -1.8, 0],
  [0, -1.8, 0],
  [2, -1.8, 0],
];
const RESET_GRID_EVENT = 'quinns-dice-reset-grid';
const ROLL_DIE_EVENT = 'quinns-dice-roll';
const DEFAULT_CAMERA_POSITION = new THREE.Vector3(0, 0, 22);

export default function QuinnsDice() {
  const d4Ref = useRef();
  const d6Ref = useRef();
  const d8Ref = useRef();
  const d10Ref = useRef();
  const d12Ref = useRef();
  const d20Ref = useRef();
  const cameraRef = useRef();
  const cameraLookAtRef = useRef(new THREE.Vector3(0, 0, 0));
  const [rollingDieId, setRollingDieId] = useState(null);
  const [detachedDieId, setDetachedDieId] = useState(null);
  const [focusedDieId, setFocusedDieId] = useState(null);
  const rollingDieIdRef = useRef(null);
  const focusedDieIdRef = useRef(null);
  const pendingRollDieIdRef = useRef(null);
  const rejoinTimerRef = useRef(0);
  const rollPowerRef = useRef(1);
  const rollDelayRef = useRef(1.5);
  const rollLaneZRef = useRef(3);
  const dieRefMap = useMemo(
    () => ({
      d4: d4Ref,
      d6: d6Ref,
      d8: d8Ref,
      d10: d10Ref,
      d12: d12Ref,
      d20: d20Ref,
    }),
    []
  );

  const resetToGrid = useCallback(() => {
    const refs = [d4Ref, d6Ref, d8Ref, d10Ref, d12Ref, d20Ref];
    refs.forEach((bodyRef, i) => {
      const body = bodyRef.current;
      if (!body) return;
      const [x, y, z] = RESET_GRID_POSITIONS[i];
      body.setTranslation({ x, y, z }, true);
      body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    });
    setRollingDieId(null);
    setDetachedDieId(null);
    rollingDieIdRef.current = null;
    rejoinTimerRef.current = 0;
  }, []);

  const findDieIdForBody = useCallback(
    (body, rigidBodyObject) => {
      if (rigidBodyObject?.name && dieRefMap[rigidBodyObject.name]) {
        return rigidBodyObject.name;
      }
      if (!body) return null;
      const { handle } = body;
      if (handle === undefined || handle === null) return null;
      const entries = Object.entries(dieRefMap);
      for (let i = 0; i < entries.length; i += 1) {
        const [id, ref] = entries[i];
        if (ref.current?.handle === handle) return id;
      }
      return null;
    },
    [dieRefMap]
  );

  const handleBottomPlaneCollision = useCallback(
    (payload) => {
      const hitId = findDieIdForBody(
        payload?.other?.rigidBody,
        payload?.other?.rigidBodyObject
      );
      const activeId = rollingDieIdRef.current;
      if (!hitId || !activeId || hitId !== activeId) return;
      setRollingDieId(null);
      rollingDieIdRef.current = null;
      rejoinTimerRef.current = rollDelayRef.current;
    },
    [findDieIdForBody]
  );

  const executeRoll = useCallback(
    (dieId) => {
      const body = dieRefMap[dieId]?.current;
      if (!body) return;

      body.setTranslation(
        {
          x: (Math.random() - 0.5) * 0.8,
          y: -0.5,
          z: rollLaneZRef.current,
        },
        true
      );
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      const power = rollPowerRef.current;
      body.applyImpulse(
        {
          x: (Math.random() - 0.5) * 2.5 * power,
          y: (11 + Math.random() * 2.5) * power,
          z: (Math.random() - 0.5) * 1.5 * power,
        },
        true
      );
      body.applyTorqueImpulse(
        {
          x: (Math.random() - 0.5) * 12 * power,
          y: (Math.random() - 0.5) * 12 * power,
          z: (Math.random() - 0.5) * 12 * power,
        },
        true
      );

      rejoinTimerRef.current = 0;
      setFocusedDieId(dieId);
      setDetachedDieId(dieId);
      setRollingDieId(dieId);
      rollingDieIdRef.current = dieId;
    },
    [dieRefMap]
  );

  const handleRoll = useCallback(
    (event) => {
      const requested = event?.detail?.target || 'random';
      const ids = Object.keys(dieRefMap);
      const dieId =
        requested === 'random'
          ? ids[Math.floor(Math.random() * ids.length)]
          : requested;

      // When switching focused dice, ease camera back to neutral before new toss.
      if (
        focusedDieIdRef.current &&
        focusedDieIdRef.current !== dieId &&
        !rollingDieIdRef.current
      ) {
        pendingRollDieIdRef.current = dieId;
        setFocusedDieId(null);
        return;
      }

      executeRoll(dieId);
    },
    [dieRefMap, executeRoll]
  );

  useEffect(() => {
    window.addEventListener(RESET_GRID_EVENT, resetToGrid);
    window.addEventListener(ROLL_DIE_EVENT, handleRoll);
    return () => {
      window.removeEventListener(RESET_GRID_EVENT, resetToGrid);
      window.removeEventListener(ROLL_DIE_EVENT, handleRoll);
    };
  }, [resetToGrid, handleRoll]);

  const {
    physicsEnabled,
    debug,
    debugLights,
    orbitControlsEnabled,
    backgroundTopColor,
    backgroundBottomColor,
    bloomEnabled,
    bloomIntensity,
    bloomLuminanceThreshold,
    bloomLuminanceSmoothing,
    bloomRadius,
    d4Scale,
    d4ColliderMode,
    d6Scale,
    d6ColliderMode,
    d8Scale,
    d8ColliderMode,
    d10Scale,
    d10ColliderMode,
    d12Scale,
    d12ColliderMode,
    d20Scale,
    d20ColliderMode,
    d20EmissiveColor,
    d20EmissiveIntensity,
    rollPower,
    rollRejoinDelaySeconds,
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
  rollPowerRef.current = rollPower;
  rollDelayRef.current = rollRejoinDelaySeconds;
  rollingDieIdRef.current = rollingDieId;
  focusedDieIdRef.current = focusedDieId;
  rollLaneZRef.current = boxDepth * 0.35;

  useFrame((_, delta) => {
    if (pendingRollDieIdRef.current && !rollingDieIdRef.current) {
      const cam = cameraRef.current;
      if (cam && cam.position.distanceTo(DEFAULT_CAMERA_POSITION) < 0.35) {
        const nextDieId = pendingRollDieIdRef.current;
        pendingRollDieIdRef.current = null;
        executeRoll(nextDieId);
      }
    }

    if (rollingDieId) {
      const body = dieRefMap[rollingDieId]?.current;
      if (body) {
        body.applyImpulse({ x: 0, y: -9.81 * delta * 2.2, z: 0 }, true);
      }
    }

    if (!rollingDieId && detachedDieId) {
      rejoinTimerRef.current = Math.max(0, rejoinTimerRef.current - delta);
      if (rejoinTimerRef.current === 0) {
        setDetachedDieId(null);
      }
    }

    const cam = cameraRef.current;
    if (!cam) return;

    const focusBody = focusedDieId ? dieRefMap[focusedDieId]?.current : null;
    const positionTarget = new THREE.Vector3().copy(DEFAULT_CAMERA_POSITION);
    const lookAtTarget = new THREE.Vector3(0, 0, 0);

    if (focusBody) {
      const t = focusBody.translation();
      lookAtTarget.set(t.x, t.y, t.z);
      if (rollingDieId) {
        positionTarget.set(t.x, t.y + 3.6, t.z + 13);
      } else {
        positionTarget.set(t.x, t.y + 1.9, t.z + 8.2);
      }
    }

    const lerpAlpha = 1 - 0.001 ** delta;
    const positionLerpStrength = pendingRollDieIdRef.current ? 0.35 : 0.55;
    const lookAtLerpStrength = pendingRollDieIdRef.current ? 0.28 : 0.45;
    cam.position.lerp(positionTarget, lerpAlpha * positionLerpStrength);
    cameraLookAtRef.current.lerp(lookAtTarget, lerpAlpha * lookAtLerpStrength);
    cam.lookAt(cameraLookAtRef.current);
  });

  return (
    <group>
      <SceneBackground
        topColor={backgroundTopColor}
        bottomColor={backgroundBottomColor}
      />
      <PerspectiveCamera
        ref={cameraRef}
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
      <Physics gravity={[0, 0, 0]} debug={debug} paused={!physicsEnabled}>
        <SceneBounds
          width={boxWidth}
          height={boxHeight}
          depth={boxDepth}
          onBottomCollisionEnter={handleBottomPlaneCollision}
        />
        <Pointer radius={pointerRadius} />
        <D4Die
          bodyRef={d4Ref}
          scale={d4Scale}
          colliderMode={d4ColliderMode}
          attractorEnabled={detachedDieId !== 'd4'}
          returnStrength={returnStrength}
          maxImpulse={maxImpulse}
          linearDamping={linearDamping}
          angularDamping={angularDamping}
          friction={friction}
          target={[targetX, targetY, targetZ]}
        />
        <D6Die
          bodyRef={d6Ref}
          scale={d6Scale}
          colliderMode={d6ColliderMode}
          attractorEnabled={detachedDieId !== 'd6'}
          returnStrength={returnStrength}
          maxImpulse={maxImpulse}
          linearDamping={linearDamping}
          angularDamping={angularDamping}
          friction={friction}
          target={[targetX, targetY, targetZ]}
        />
        <D8Die
          bodyRef={d8Ref}
          scale={d8Scale}
          colliderMode={d8ColliderMode}
          attractorEnabled={detachedDieId !== 'd8'}
          returnStrength={returnStrength}
          maxImpulse={maxImpulse}
          linearDamping={linearDamping}
          angularDamping={angularDamping}
          friction={friction}
          target={[targetX, targetY, targetZ]}
        />
        <D10Die
          bodyRef={d10Ref}
          scale={d10Scale}
          colliderMode={d10ColliderMode}
          attractorEnabled={detachedDieId !== 'd10'}
          returnStrength={returnStrength}
          maxImpulse={maxImpulse}
          linearDamping={linearDamping}
          angularDamping={angularDamping}
          friction={friction}
          target={[targetX, targetY, targetZ]}
        />
        <D12Die
          bodyRef={d12Ref}
          scale={d12Scale}
          colliderMode={d12ColliderMode}
          attractorEnabled={detachedDieId !== 'd12'}
          returnStrength={returnStrength}
          maxImpulse={maxImpulse}
          linearDamping={linearDamping}
          angularDamping={angularDamping}
          friction={friction}
          target={[targetX, targetY, targetZ]}
        />
        <D20Die
          bodyRef={d20Ref}
          scale={d20Scale}
          colliderMode={d20ColliderMode}
          attractorEnabled={detachedDieId !== 'd20'}
          emissiveColor={d20EmissiveColor}
          emissiveIntensity={d20EmissiveIntensity}
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
        <Bloom
          intensity={bloomEnabled ? bloomIntensity : 0}
          luminanceThreshold={bloomLuminanceThreshold}
          luminanceSmoothing={bloomLuminanceSmoothing}
          mipmapBlur
          radius={bloomRadius}
        />
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
      <Environment preset="city" />
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

function SceneBounds({
  width = 30,
  height = 30,
  depth = 30,
  onBottomCollisionEnter,
}) {
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
        friction={1}
        restitution={0}
        onContactForce={onBottomCollisionEnter}
        onCollisionEnter={onBottomCollisionEnter}
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

      {/* Shadow catcher on the lowest collision plane to make die landings readable */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -halfH + wallThickness + 0.001, 0]}
      >
        <planeGeometry args={[width, depth]} />
        <shadowMaterial transparent opacity={0.3} />
      </mesh>
    </RigidBody>
  );
}

function DieBody({
  name,
  position,
  children,
  bodyRef,
  vec = new THREE.Vector3(),
  r = THREE.MathUtils.randFloatSpread,
  returnStrength = 0.2,
  maxImpulse = 0.5,
  linearDamping = 4,
  angularDamping = 1,
  friction = 0.1,
  attractorEnabled = true,
  target = [0, 0, 0],
  colliders = false,
  restitution = 0.05,
}) {
  const internalRef = useRef();
  const api = bodyRef || internalRef;
  const pos = useMemo(() => position || [r(10), r(10), r(10)], []);
  useFrame((_, delta) => {
    const body = api.current;
    if (!body || !attractorEnabled) return;
    delta = Math.min(0.1, delta);
    const translation = body.translation();
    vec
      .set(target[0], target[1], target[2])
      .sub(translation)
      .multiplyScalar(returnStrength * delta * 60)
      .clampLength(0, maxImpulse);
    body.applyImpulse(vec, true);
  });
  return (
    <RigidBody
      name={name}
      linearDamping={linearDamping}
      angularDamping={angularDamping}
      friction={friction}
      restitution={restitution}
      position={pos}
      ref={api}
      colliders={colliders}
      canSleep
      ccd
    >
      {children}
    </RigidBody>
  );
}

function D4Die({ scale = 1, bodyRef, colliderMode = 'ball', ...props }) {
  const { position } = dice[0];
  const colliders =
    colliderMode === 'trimesh'
      ? 'trimesh'
      : colliderMode === 'hull'
        ? 'hull'
        : false;
  return (
    <DieBody
      name="d4"
      position={position}
      bodyRef={bodyRef}
      colliders={colliders}
      {...props}
    >
      {colliderMode === 'ball' && <BallCollider args={[0.9]} />}
      {colliderMode === 'cuboid' && <CuboidCollider args={[0.8, 0.8, 0.8]} />}
      {colliderMode === 'roundCuboid' && (
        <RoundCuboidCollider args={[0.8, 0.8, 0.8, 0.12]} />
      )}
      <Center>
        <group scale={scale}>
          <QuinnsD4 />
        </group>
      </Center>
    </DieBody>
  );
}

function D6Die({ scale = 1, bodyRef, colliderMode = 'roundCuboid', ...props }) {
  const { position } = dice[1];
  const colliders =
    colliderMode === 'trimesh'
      ? 'trimesh'
      : colliderMode === 'hull'
        ? 'hull'
        : false;
  return (
    <DieBody
      name="d6"
      position={position}
      bodyRef={bodyRef}
      colliders={colliders}
      {...props}
    >
      {colliderMode === 'ball' && <BallCollider args={[0.9]} />}
      {colliderMode === 'cuboid' && <CuboidCollider args={[0.9, 0.9, 0.9]} />}
      {colliderMode === 'roundCuboid' && (
        <RoundCuboidCollider args={[0.9, 0.9, 0.9, 0.14]} />
      )}
      <Center>
        <group scale={scale}>
          <QuinnsD6 />
        </group>
      </Center>
    </DieBody>
  );
}

function D8Die({ scale = 1, bodyRef, colliderMode = 'ball', ...props }) {
  const { position } = dice[2];
  const colliders =
    colliderMode === 'trimesh'
      ? 'trimesh'
      : colliderMode === 'hull'
        ? 'hull'
        : false;
  return (
    <DieBody
      name="d8"
      position={position}
      bodyRef={bodyRef}
      colliders={colliders}
      {...props}
    >
      {colliderMode === 'ball' && <BallCollider args={[0.9]} />}
      {colliderMode === 'cuboid' && (
        <CuboidCollider args={[0.85, 0.85, 0.85]} />
      )}
      {colliderMode === 'roundCuboid' && (
        <RoundCuboidCollider args={[0.85, 0.85, 0.85, 0.1]} />
      )}
      <Center>
        <group scale={scale}>
          <QuinnsD8 />
        </group>
      </Center>
    </DieBody>
  );
}

function D10Die({ scale = 1, bodyRef, colliderMode = 'ball', ...props }) {
  const { position } = dice[3];
  const colliders =
    colliderMode === 'trimesh'
      ? 'trimesh'
      : colliderMode === 'hull'
        ? 'hull'
        : false;
  return (
    <DieBody
      name="d10"
      position={position}
      bodyRef={bodyRef}
      colliders={colliders}
      {...props}
    >
      {colliderMode === 'ball' && <BallCollider args={[1]} />}
      {colliderMode === 'cuboid' && (
        <CuboidCollider args={[0.95, 0.95, 0.95]} />
      )}
      {colliderMode === 'roundCuboid' && (
        <RoundCuboidCollider args={[0.95, 0.95, 0.95, 0.1]} />
      )}
      <Center>
        <group scale={scale}>
          <QuinnsD10 />
        </group>
      </Center>
    </DieBody>
  );
}

function D12Die({ scale = 1, bodyRef, colliderMode = 'ball', ...props }) {
  const { position } = dice[4];
  const colliders =
    colliderMode === 'trimesh'
      ? 'trimesh'
      : colliderMode === 'hull'
        ? 'hull'
        : false;
  return (
    <DieBody
      name="d12"
      position={position}
      bodyRef={bodyRef}
      colliders={colliders}
      {...props}
    >
      {colliderMode === 'ball' && <BallCollider args={[1]} />}
      {colliderMode === 'cuboid' && (
        <CuboidCollider args={[0.95, 0.95, 0.95]} />
      )}
      {colliderMode === 'roundCuboid' && (
        <RoundCuboidCollider args={[0.95, 0.95, 0.95, 0.1]} />
      )}
      <Center>
        <group scale={scale}>
          <QuinnsD12 />
        </group>
      </Center>
    </DieBody>
  );
}

function D20Die({
  bodyRef,
  scale = 1,
  colliderMode = 'ball',
  emissiveColor = '#ffffff',
  emissiveIntensity = 1,
  ...props
}) {
  const { position } = dice[5];
  const colliders =
    colliderMode === 'trimesh'
      ? 'trimesh'
      : colliderMode === 'hull'
        ? 'hull'
        : false;
  return (
    <DieBody
      name="d20"
      position={position}
      bodyRef={bodyRef}
      colliders={colliders}
      {...props}
    >
      {colliderMode === 'ball' && <BallCollider args={[1]} />}
      {colliderMode === 'cuboid' && (
        <CuboidCollider args={[0.95, 0.95, 0.95]} />
      )}
      {colliderMode === 'roundCuboid' && (
        <RoundCuboidCollider args={[0.95, 0.95, 0.95, 0.1]} />
      )}
      <Center>
        <D20Visual
          scale={scale}
          emissiveColor={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </Center>
    </DieBody>
  );
}

function D20Visual({
  scale = 1,
  emissiveColor = '#ffffff',
  emissiveIntensity = 1,
}) {
  const groupRef = useRef();

  useEffect(() => {
    const root = groupRef.current;
    if (!root) return;

    root.traverse((obj) => {
      if (!obj.isMesh) return;
      const mat = obj.material;
      if (!mat) return;
      if (mat.emissive) mat.emissive.set(emissiveColor);
      if ('emissiveIntensity' in mat) mat.emissiveIntensity = emissiveIntensity;
      mat.needsUpdate = true;
    });
  }, [emissiveColor, emissiveIntensity]);

  return (
    <group ref={groupRef} scale={scale}>
      <QuinnsD20 />
    </group>
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
