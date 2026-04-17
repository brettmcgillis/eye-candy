import * as THREE from 'three';

import React, {
  forwardRef,
  memo,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import { useFrame } from '@react-three/fiber';

import ClothMesh from '../cloth/ClothMesh';
import { pinRing } from '../cloth/pinHelpers';

const SPHERE_BASE_Y = -0.15;
const SPHERE_RADIUS = 0.15;

const CUTOUTS = [
  { u: 0.43, v: 0.4, radius: 0.06 },
  { u: 0.57, v: 0.4, radius: 0.06 },
];

const sharedTrailTarget = new THREE.Vector3();

const GhostCharacter = forwardRef(function GhostCharacter(
  {
    // Animation config
    bobAmplitude = 0.03,
    bobSpeed = 0.5,
    swayAmplitude = 0.02,
    tiltIntensity = 0.3,
    baseWind = 0.3,
    windBoostMul = 2,
    squashIntensity = 0.3,
    // Animation input — caller supplies per-frame input via this ref
    animationInputRef,
    // Cloth & material
    color = '#f5f0e8',
    eyeColor = '#88ccff',
    eyeIntensity = 3,
    stiffness = 0.15,
    dampening = 0.99,
    handSize = 0.04,
    handHeight = 0.12,
    handSpacing = 0.18,
    handSpring = 8,
    handTrail = 0.15,
    cursorCollider = true,
    cursorRadius = 0.12,
    collisionMargin = 0.02,
    gravity = 0.00012,
    windAmplitude = 0.0004,
    maxVelocity = 0.01,
    segmentsX = 28,
    segmentsY = 28,
    debugColliders = false,
    debugColor = '#ff4444',
    holeAmount = 0.2,
    edgeFade = 0.15,
    tatterEdge = 0,
    alphaScale = 4,
    alphaSeed = 42,
    roughness = 0.8,
    metalness = 0,
    opacity = 1,
    paused = false,
  },
  ref
) {
  const clothRef = useRef();
  const groupRef = useRef();
  const lightLeftRef = useRef();
  const lightRightRef = useRef();

  // Centre pins only — recomputed when segments change.
  const pins = useMemo(
    () =>
      pinRing(
        Math.round(segmentsX / 2),
        Math.round(segmentsY / 2),
        2,
        segmentsX,
        segmentsY
      ),
    [segmentsX, segmentsY]
  );

  const spherePos = useMemo(() => new THREE.Vector3(0, SPHERE_BASE_Y, 0), []);
  const handLeftPos = useMemo(
    () => new THREE.Vector3(-handSpacing, -handHeight, 0),
    [] // eslint-disable-line -- initial position only
  );
  const handRightPos = useMemo(
    () => new THREE.Vector3(handSpacing, -handHeight, 0),
    [] // eslint-disable-line -- initial position only
  );

  const colliders = useMemo(
    () => [
      { position: spherePos, radius: SPHERE_RADIUS },
      { position: handLeftPos, radius: handSize },
      { position: handRightPos, radius: handSize },
    ],
    [spherePos, handLeftPos, handRightPos, handSize]
  );

  useImperativeHandle(
    ref,
    () => ({
      get sim() {
        return clothRef.current?.sim;
      },
      resetSim() {
        clothRef.current?.resetSim();
      },
    }),
    []
  );

  // Animation state (owned by the character)
  const animState = useRef({
    time: 0,
    prevWindDirX: 0,
    prevWindDirZ: 0,
    bankX: 0,
    bankZ: 0,
    jumpTime: -1,
  });

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const state = animState.current;
    state.time += dt;

    // Read input from caller
    const input = animationInputRef?.current ?? {};
    const inputDirX = input.windDirX ?? 0;
    const inputDirZ = input.windDirZ ?? 0;
    const windStrength = input.windStrength ?? 0;
    const jumpTriggered = input.jumpTriggered ?? false;

    // Bob
    const bob = Math.sin(state.time * bobSpeed * Math.PI * 2) * bobAmplitude;

    // Sway
    const swayX =
      Math.sin(state.time * bobSpeed * 0.7 * Math.PI * 2) * swayAmplitude;
    const swayZ =
      Math.sin(state.time * bobSpeed * 0.5 * Math.PI * 2 + 1.3) * swayAmplitude;

    // Wind direction
    let wdx = inputDirX;
    let wdz = inputDirZ;
    if (windStrength < 0.001) {
      wdx = 1;
      wdz = 0;
    }
    const effectiveWind = baseWind + windStrength * windBoostMul;

    // Turn bank
    const dirChangeX = wdx * windStrength - state.prevWindDirX;
    const dirChangeZ = wdz * windStrength - state.prevWindDirZ;
    state.bankX += dirChangeX * 0.5;
    state.bankZ += dirChangeZ * 0.5;
    state.bankX *= Math.exp(-8 * dt);
    state.bankZ *= Math.exp(-8 * dt);
    state.prevWindDirX = wdx * windStrength;
    state.prevWindDirZ = wdz * windStrength;

    // Tilt
    const tiltInputX = inputDirX * windStrength;
    const tiltInputZ = inputDirZ * windStrength;
    const tiltX = -tiltInputZ * tiltIntensity + state.bankZ * 0.3 + swayX * 0.3;
    const tiltZ = tiltInputX * tiltIntensity + state.bankX * 0.3 + swayZ * 0.3;

    // Jump squash/stretch
    if (jumpTriggered && state.jumpTime < 0) {
      state.jumpTime = 0;
    }
    let squash = 1;
    let windDirY = 0;
    if (state.jumpTime >= 0) {
      const t = state.jumpTime;
      state.jumpTime += dt;
      if (t < 0.15) {
        squash = 1 - squashIntensity * Math.sin((t / 0.15) * Math.PI * 0.5);
        windDirY = 0.3;
      } else if (t < 0.35) {
        squash =
          1 + squashIntensity * 0.8 * Math.sin(((t - 0.15) / 0.2) * Math.PI);
        windDirY = -0.4;
      } else if (t < 0.65) {
        const p = (t - 0.35) / 0.3;
        squash = 1 + squashIntensity * 0.2 * Math.sin(p * Math.PI) * (1 - p);
        windDirY = 0.2 * (1 - p);
      } else {
        state.jumpTime = -1;
      }
    }

    // Apply transforms to own group
    const group = groupRef.current;
    if (group) {
      group.position.y = bob;
      group.rotation.x = 0.3 + tiltX;
      group.rotation.z = tiltZ;
      group.scale.set(1, squash, 1);
    }

    // Push wind to cloth sim
    const sim = clothRef.current?.sim;
    if (sim) {
      sim.windU.value = effectiveWind;
      const len = Math.sqrt(wdx * wdx + windDirY * windDirY + wdz * wdz);
      if (len > 0.0001) {
        sim.windDirU.value.set(wdx / len, windDirY / len, wdz / len);
      }
    }

    // Hand trailing
    const springT = 1 - Math.exp(-handSpring * dt);
    const trailScale = effectiveWind * handTrail;

    sharedTrailTarget.set(
      -handSpacing + wdx * trailScale,
      -handHeight,
      wdz * trailScale
    );
    handLeftPos.lerp(sharedTrailTarget, springT);

    sharedTrailTarget.set(
      handSpacing - wdx * trailScale,
      -handHeight,
      -wdz * trailScale
    );
    handRightPos.lerp(sharedTrailTarget, springT);
  });

  return (
    <group ref={groupRef}>
      <ClothMesh
        key={`cloth-${segmentsX}-${segmentsY}`}
        ref={clothRef}
        width={1.0}
        height={1.0}
        segmentsX={segmentsX}
        segmentsY={segmentsY}
        pins={pins}
        centered
        orientation="horizontal"
        shape="circle"
        gravity={gravity}
        windAmplitude={windAmplitude}
        stepsPerSecond={360}
        maxVelocity={maxVelocity}
        windManaged
        stiffness={stiffness}
        dampening={dampening}
        cursorCollider={cursorCollider}
        cursorRadius={cursorRadius}
        collisionMargin={collisionMargin}
        colliders={colliders}
        debugColliders={debugColliders}
        debugColor={debugColor}
        alphaSeed={alphaSeed}
        alphaScale={alphaScale}
        edgeFade={edgeFade}
        holeAmount={holeAmount}
        tatterEdge={tatterEdge}
        cutouts={CUTOUTS}
        paused={paused}
        materialProps={{ color, roughness, metalness, opacity }}
      />

      <pointLight
        ref={lightLeftRef}
        position={[-0.05, SPHERE_BASE_Y, 0]}
        color={eyeColor}
        intensity={eyeIntensity * 0.3}
        distance={0.5}
        decay={2}
      />
      <pointLight
        ref={lightRightRef}
        position={[0.05, SPHERE_BASE_Y, 0]}
        color={eyeColor}
        intensity={eyeIntensity * 0.3}
        distance={0.5}
        decay={2}
      />
    </group>
  );
});

export default memo(GhostCharacter);
