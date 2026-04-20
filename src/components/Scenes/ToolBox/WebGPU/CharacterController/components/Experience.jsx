import { folder, useControls } from 'leva';

import React, { useEffect, useState } from 'react';

import { KeyboardControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';

import Ecctrl from '../../../../../ecctrl/Ecctrl';
import { GridMaterial } from '../../../../../materials/webGPU/gridMaterial';
import CharacterModel from './CharacterModel';
import DynamicPlatforms from './DynamicPlatforms';
import FloatingPlatform from './FloatingPlatform';
import Floor from './Floor';
import Lights from './Lights';
import RigidObjects from './RigidObjects';
import RoughPlane from './RoughPlane';
import ShotCube from './ShotCube';
import Slopes from './Slopes';
import Steps from './Steps';

const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'run', keys: ['Shift'] },
  { name: 'action1', keys: ['1'] },
  { name: 'action2', keys: ['2'] },
  { name: 'action3', keys: ['3'] },
  { name: 'action4', keys: ['KeyF'] },
];

export default function Experience() {
  const { gl } = useThree();

  const [pausedPhysics, setPausedPhysics] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setPausedPhysics(false), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const canvas = gl.domElement;
    const lock = () => {
      const p = canvas.requestPointerLock();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    };
    canvas.addEventListener('click', lock);
    return () => canvas.removeEventListener('click', lock);
  }, [gl]);

  // Day/Night mode helper
  const dayNightPresets = {
    Day: {
      bgColor: '#a8c8e8',
      gridBgColor: '#d9d9d9',
      gridLineColor: '#222222',
    },
    Night: {
      bgColor: '#0f1419',
      gridBgColor: '#40404c',
      gridLineColor: '#26262c',
    },
  };

  const {
    characterModel,
    physics,
    shotsEnabled,
    disableControl,
    disableFollowCam,
    invertGamepadMovX,
    invertGamepadMovY,
    invertGamepadCamX,
    invertGamepadCamY,
    // Movement
    maxVelLimit,
    turnVelMultiplier,
    turnSpeed,
    sprintMult,
    jumpVel,
    airDragMultiplier,
    fallingGravityScale,
    // Capsule
    capsuleHalfHeight,
    capsuleRadius,
    floatHeight,
    // Floating spring
    springK,
    dampingC,
    // Auto balance
    autoBalance,
    autoBalanceSpringK,
    autoBalanceDampingC,
    autoBalanceSpringOnY,
    autoBalanceDampingOnY,
    // Camera
    camInitDis,
    camMaxDis,
    camMinDis,
    camFollowMult,
    camLerpMult,
    // Scene
    mode,
    bgColor,
    gridBgColor,
    gridLineColor,
  } = useControls('World Settings', {
    Character: folder(
      {
        characterModel: {
          value: 'Capsule',
          options: ['Capsule', 'Gh0st', 'Seal'],
        },
      },
      { collapsed: true }
    ),

    Scene: folder(
      {
        mode: {
          value: 'Day',
          options: ['Day', 'Night'],
        },
        bgColor: { value: '#a8c8e8' },
        gridBgColor: [0.85, 0.85, 0.85],
        gridLineColor: [0.6, 0.6, 0.6],
      },
      { collapsed: false }
    ),

    physics: false,
    shotsEnabled: false,
    disableControl: false,
    disableFollowCam: false,

    Gamepad: folder(
      {
        invertGamepadMovX: false,
        invertGamepadMovY: true,
        invertGamepadCamX: false,
        invertGamepadCamY: false,
      },
      { collapsed: true }
    ),

    Movement: folder(
      {
        maxVelLimit: { value: 2.5, min: 0, max: 20, step: 0.1 },
        turnVelMultiplier: { value: 0.2, min: 0, max: 1, step: 0.01 },
        turnSpeed: { value: 15, min: 1, max: 30, step: 0.5 },
        sprintMult: { value: 2, min: 1, max: 5, step: 0.1 },
        jumpVel: { value: 4, min: 0, max: 20, step: 0.1 },
        airDragMultiplier: { value: 0.2, min: 0, max: 1, step: 0.01 },
        fallingGravityScale: { value: 2.5, min: 0, max: 10, step: 0.1 },
      },
      { collapsed: true }
    ),

    Capsule: folder(
      {
        capsuleHalfHeight: { value: 0.35, min: 0.1, max: 2, step: 0.05 },
        capsuleRadius: { value: 0.3, min: 0.1, max: 1, step: 0.05 },
        floatHeight: { value: 0.3, min: 0, max: 2, step: 0.05 },
      },
      { collapsed: true }
    ),

    'Floating Spring': folder(
      {
        springK: { value: 1.2, min: 0, max: 5, step: 0.05 },
        dampingC: { value: 0.08, min: 0, max: 1, step: 0.01 },
      },
      { collapsed: true }
    ),

    'Auto Balance': folder(
      {
        autoBalance: true,
        autoBalanceSpringK: { value: 0.3, min: 0, max: 3, step: 0.01 },
        autoBalanceDampingC: { value: 0.03, min: 0, max: 0.5, step: 0.005 },
        autoBalanceSpringOnY: { value: 0.5, min: 0, max: 3, step: 0.01 },
        autoBalanceDampingOnY: { value: 0.015, min: 0, max: 0.5, step: 0.005 },
      },
      { collapsed: true }
    ),

    Camera: folder(
      {
        camInitDis: { value: -5, min: -20, max: -0.5, step: 0.1 },
        camMaxDis: { value: -7, min: -20, max: -1, step: 0.1 },
        camMinDis: { value: -0.7, min: -5, max: 0, step: 0.1 },
        camFollowMult: { value: 11, min: 1, max: 30, step: 0.5 },
        camLerpMult: { value: 25, min: 1, max: 60, step: 0.5 },
      },
      { collapsed: true }
    ),
  });

  // Update colors when mode changes
  React.useEffect(() => {
    if (mode && dayNightPresets[mode]) {
      // Mode changed, colors will be applied below
    }
  }, [mode]);

  // Determine effective colors based on mode
  const preset = mode && dayNightPresets[mode] ? dayNightPresets[mode] : null;
  const effectiveBgColor = preset?.bgColor ?? bgColor;
  const effectiveGridBgColor = preset?.gridBgColor ?? gridBgColor;
  const effectiveGridLineColor = preset?.gridLineColor ?? gridLineColor;

  return (
    <>
      <mesh
        position={[0, -0.99, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        userData={{ camExcludeCollision: true }}
      >
        <planeGeometry args={[300, 300]} />
        <GridMaterial
          gridSize={1}
          lineWidth={0.03}
          bgColor={effectiveGridBgColor}
          lineColor={effectiveGridLineColor}
        />
      </mesh>

      <mesh
        receiveShadow
        position={[0, -0.989, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        userData={{ camExcludeCollision: true }}
      >
        <planeGeometry args={[300, 300]} />
        <shadowMaterial opacity={0.35} transparent />
      </mesh>

      <Lights mode={mode} />

      <color attach="background" args={[effectiveBgColor]} />

      <Physics debug={physics} paused={pausedPhysics}>
        <KeyboardControls map={keyboardMap}>
          <Ecctrl
            animated
            followLight
            disableControl={disableControl}
            disableFollowCam={disableFollowCam}
            invertGamepadMovX={invertGamepadMovX}
            invertGamepadMovY={invertGamepadMovY}
            invertGamepadCamX={invertGamepadCamX}
            invertGamepadCamY={invertGamepadCamY}
            maxVelLimit={maxVelLimit}
            turnVelMultiplier={turnVelMultiplier}
            turnSpeed={turnSpeed}
            sprintMult={sprintMult}
            jumpVel={jumpVel}
            airDragMultiplier={airDragMultiplier}
            fallingGravityScale={fallingGravityScale}
            capsuleHalfHeight={capsuleHalfHeight}
            capsuleRadius={capsuleRadius}
            floatHeight={floatHeight}
            springK={springK}
            dampingC={dampingC}
            autoBalance={autoBalance}
            autoBalanceSpringK={autoBalanceSpringK}
            autoBalanceDampingC={autoBalanceDampingC}
            autoBalanceSpringOnY={autoBalanceSpringOnY}
            autoBalanceDampingOnY={autoBalanceDampingOnY}
            camInitDis={camInitDis}
            camMaxDis={camMaxDis}
            camMinDis={camMinDis}
            camFollowMult={camFollowMult}
            camLerpMult={camLerpMult}
          >
            <CharacterModel variant={characterModel} />
          </Ecctrl>
        </KeyboardControls>

        <RoughPlane />
        <Slopes />
        <Steps />
        <RigidObjects />
        <FloatingPlatform />
        <DynamicPlatforms />
        <Floor />
        {shotsEnabled && <ShotCube />}
      </Physics>
    </>
  );
}
