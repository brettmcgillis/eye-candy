import { folder, useControls } from 'leva';

import React, { useEffect, useRef, useState } from 'react';

import { KeyboardControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';

import Ecctrl, { useGame } from '../../../../../ecctrl/Ecctrl';
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
  const setMoveToPoint = useGame((state) => state.setMoveToPoint);
  const pointerDownAtRef = useRef(0);
  const [hoverPoint, setHoverPoint] = useState(null);
  const [moveTargetPoint, setMoveTargetPoint] = useState(null);

  const [pausedPhysics, setPausedPhysics] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setPausedPhysics(false), 500);
    return () => clearTimeout(t);
  }, []);

  // Day/Night mode helper
  const dayNightPresets = {
    Day: {
      bgColor: '#a8c8e8',
      gridSectionColor: '#d9d9d9',
      gridCellColor: '#222222',
    },
    Night: {
      bgColor: '#0f1419',
      gridSectionColor: '#40404c',
      gridCellColor: '#26262c',
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
    ecctrlMode,
    // Scene
    sceneMode,
    fpsMode,
    bgColor,
    gridSectionColor,
    gridCellColor,
  } = useControls('World Settings', {
    Character: folder(
      {
        characterModel: {
          value: 'Capsule',
          options: ['Capsule', 'Seal'],
        },
      },
      { collapsed: true }
    ),

    Scene: folder(
      {
        sceneMode: {
          value: 'Day',
          options: ['Day', 'Night'],
        },
        ecctrlMode: {
          value: null,
          options: {
            Off: null,
            CameraBasedMovement: 'CameraBasedMovement',
            FixedCamera: 'FixedCamera',
            PointToMove: 'PointToMove',
          },
        },
        fpsMode: false,
        bgColor: {
          value: '#a8c8e8',
        },
        gridSectionColor: { value: '#d9d9d9' },
        gridCellColor: { value: '#222222' },
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
    if (sceneMode && dayNightPresets[sceneMode]) {
      // Mode changed, colors will be applied below
    }
  }, [sceneMode]);

  // Determine effective colors based on mode
  const preset =
    sceneMode && dayNightPresets[sceneMode] ? dayNightPresets[sceneMode] : null;
  const effectiveBgColor = preset?.bgColor ?? bgColor;
  const effectiveGridSectionColor =
    preset?.gridSectionColor ?? gridSectionColor;
  const effectiveGridCellColor = preset?.gridCellColor ?? gridCellColor;
  const effectiveEcctrlMode = fpsMode ? 'CameraBasedMovement' : ecctrlMode;
  const pointToMoveActive = effectiveEcctrlMode === 'PointToMove';
  const effectiveTurnVelMultiplier = fpsMode ? 1 : turnVelMultiplier;
  const effectiveTurnSpeed = fpsMode ? 100 : turnSpeed;
  const effectiveCamCollision = !fpsMode;
  const effectiveCamInitDis = fpsMode ? -0.01 : camInitDis;
  const effectiveCamMaxDis = fpsMode ? -0.01 : camMaxDis;
  const effectiveCamMinDis = fpsMode ? -0.01 : camMinDis;
  const effectiveCamFollowMult = fpsMode ? 1000 : camFollowMult;
  const effectiveCamLerpMult = fpsMode ? 1000 : camLerpMult;
  const ecctrlInstanceKey = fpsMode ? 'fps-on' : 'fps-off';

  const handlePointToMoveHover = React.useCallback(
    (event) => {
      if (!pointToMoveActive) return;
      event.stopPropagation();
      setHoverPoint(event.point.clone());
    },
    [pointToMoveActive]
  );

  const handlePointToMoveDown = React.useCallback(
    (event) => {
      if (!pointToMoveActive) return;
      event.stopPropagation();
      pointerDownAtRef.current = Date.now();
    },
    [pointToMoveActive]
  );

  const handlePointToMoveUp = React.useCallback(
    (event) => {
      if (!pointToMoveActive) return;
      event.stopPropagation();
      if (Date.now() - pointerDownAtRef.current >= 220) return;
      const point = event.point.clone();
      setMoveToPoint(point);
      setMoveTargetPoint(point);
    },
    [pointToMoveActive, setMoveToPoint]
  );

  useEffect(() => {
    const canvas = gl.domElement;

    if (pointToMoveActive) {
      if (document.pointerLockElement === canvas) {
        document.exitPointerLock();
      }
      return undefined;
    }

    const lock = () => {
      const p = canvas.requestPointerLock();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    };

    canvas.addEventListener('click', lock);
    return () => canvas.removeEventListener('click', lock);
  }, [gl, pointToMoveActive]);

  useEffect(() => {
    if (!pointToMoveActive) {
      setMoveToPoint(null);
      setHoverPoint(null);
      setMoveTargetPoint(null);
    }
  }, [pointToMoveActive, setMoveToPoint]);

  const characterController = (
    <Ecctrl
      key={ecctrlInstanceKey}
      animated
      followLight
      disableControl={disableControl}
      disableFollowCam={disableFollowCam}
      invertGamepadMovX={invertGamepadMovX}
      invertGamepadMovY={invertGamepadMovY}
      invertGamepadCamX={invertGamepadCamX}
      invertGamepadCamY={invertGamepadCamY}
      maxVelLimit={maxVelLimit}
      turnVelMultiplier={effectiveTurnVelMultiplier}
      turnSpeed={effectiveTurnSpeed}
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
      camCollision={effectiveCamCollision}
      camInitDis={effectiveCamInitDis}
      camMaxDis={effectiveCamMaxDis}
      camMinDis={effectiveCamMinDis}
      camFollowMult={effectiveCamFollowMult}
      camLerpMult={effectiveCamLerpMult}
      mode={effectiveEcctrlMode}
    >
      <CharacterModel variant={characterModel} />
    </Ecctrl>
  );

  return (
    <>
      <Lights mode={sceneMode} />

      <color attach="background" args={[effectiveBgColor]} />

      {pointToMoveActive && hoverPoint && (
        <mesh
          position={[hoverPoint.x, hoverPoint.y + 0.01, hoverPoint.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          userData={{ camExcludeCollision: true }}
        >
          <ringGeometry args={[0.18, 0.28, 48]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.2} />
        </mesh>
      )}

      {pointToMoveActive && moveTargetPoint && (
        <mesh
          position={[
            moveTargetPoint.x,
            moveTargetPoint.y + 0.012,
            moveTargetPoint.z,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
          userData={{ camExcludeCollision: true }}
        >
          <ringGeometry args={[0.22, 0.34, 48]} />
          <meshBasicMaterial color="#ff7a00" transparent opacity={0.75} />
        </mesh>
      )}

      <Physics debug={physics} paused={pausedPhysics}>
        {pointToMoveActive ? (
          characterController
        ) : (
          <KeyboardControls map={keyboardMap}>
            {characterController}
          </KeyboardControls>
        )}

        <RoughPlane />
        <Slopes />
        <Steps />
        <RigidObjects />
        <FloatingPlatform />
        <DynamicPlatforms />
        <Floor
          gridSectionColor={effectiveGridSectionColor}
          gridCellColor={effectiveGridCellColor}
          onPointerMove={handlePointToMoveHover}
          onPointerDown={handlePointToMoveDown}
          onPointerUp={handlePointToMoveUp}
        />
        {shotsEnabled && <ShotCube />}
      </Physics>
    </>
  );
}
