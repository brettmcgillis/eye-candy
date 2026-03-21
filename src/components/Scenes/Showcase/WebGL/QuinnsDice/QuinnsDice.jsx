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
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';

import {
  Center,
  Environment,
  Lightformer,
  MeshTransmissionMaterial,
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
  useBeforePhysicsStep,
} from '@react-three/rapier';

import useHandGestureEvents from '../../../../../hooks/hands/useHandGestureEvents';
import useHandControls from '../../../../../hooks/hands/useHandcontrols';
import useMediaPipeHands from '../../../../../hooks/hands/useMediaPipeHands';
import QuinnsD4 from '../../../../elements/quinnsDice/QuinnsD4';
import QuinnsD6 from '../../../../elements/quinnsDice/QuinnsD6';
import QuinnsD8 from '../../../../elements/quinnsDice/QuinnsD8';
import QuinnsD10 from '../../../../elements/quinnsDice/QuinnsD10';
import QuinnsD12 from '../../../../elements/quinnsDice/QuinnsD12';
import QuinnsD20 from '../../../../elements/quinnsDice/QuinnsD20';
import {
  DEFAULT_CAMERA_POSITION_VALUES,
  DICE_CONFIGS,
  LIGHTFORMER_CONFIGS,
  MAIN_LIGHT_POSITION,
  MAIN_LIGHT_TARGET,
  RESET_GRID_EVENT,
  RESET_GRID_POSITIONS,
  ROLL_DIE_EVENT,
} from './QuinnsDice.sceneSettings';
import useQuinnsDiceControls from './useQuinnsDiceControls';

const DEFAULT_CAMERA_POSITION = new THREE.Vector3(
  ...DEFAULT_CAMERA_POSITION_VALUES
);
const CAMERA_DEFAULT_LOOK_AT = new THREE.Vector3(0, 0, 0);
const DIE_IDS = DICE_CONFIGS.map((config) => config.id);
const ZERO_VEL = { x: 0, y: 0, z: 0 };
const GRAVITY_IMPULSE = { x: 0, y: -0.1, z: 0 };

export default function QuinnsDice() {
  const d4Ref = useRef();
  const d6Ref = useRef();
  const d8Ref = useRef();
  const d10Ref = useRef();
  const d12Ref = useRef();
  const d20Ref = useRef();
  const cameraRef = useRef();
  const cameraLookAtRef = useRef(new THREE.Vector3(0, 0, 0));
  const rollingDieIdRef = useRef(null);
  const focusedDieIdRef = useRef(null);
  const detachedDieIdRef = useRef(null);
  const pendingRollDieIdRef = useRef(null);
  const orbitControlsEnabledRef = useRef(false);
  const rejoinTimerRef = useRef(0);
  const rollPowerRef = useRef(1);
  const rollDelayRef = useRef(1.5);
  const rollLaneZRef = useRef(3);
  const size = useThree((state) => state.size);
  const cameraPositionTargetRef = useRef(new THREE.Vector3());
  const cameraLookAtTargetRef = useRef(new THREE.Vector3());
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
    rollingDieIdRef.current = null;
    focusedDieIdRef.current = null;
    detachedDieIdRef.current = null;
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
      focusedDieIdRef.current = dieId;
      detachedDieIdRef.current = dieId;
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
        !orbitControlsEnabledRef.current &&
        focusedDieIdRef.current &&
        focusedDieIdRef.current !== dieId &&
        !rollingDieIdRef.current
      ) {
        pendingRollDieIdRef.current = dieId;
        focusedDieIdRef.current = null;
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
    mode,
    autoSpeed,
    handsShowVideo,
    handsShowDebugSkeleton,
    handsVideoSize,
    handsCameraWidth,
    handsCameraHeight,
    handsXScale,
    handsYScale,
    handsZScale,
    handsLandmarkColor,
    handsConnectorColor,
    handsLandmarkRadius,
    handsConnectorLineWidth,
    handsEnableGestures,
    handsPointRollEnabled,
    handsPointRollCooldownMs,
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
    d6Scale,
    d8Scale,
    d10Scale,
    d12Scale,
    d20Scale,
    d20EmissiveColor,
    d20EmissiveIntensity,
    rollPower,
    rollRejoinDelaySeconds,
    returnStrength,
    maxImpulse,
    linearDamping,
    angularDamping,
    friction,
    boxDepth,
    targetX,
    targetY,
    targetZ,
    pointerRadius,
    pointerFollowSpeed,
    pointerLook,
    pointerLightColor,
    pointerLightIntensity,
    pointerLightDistance,
    pointerLightDecay,
    pointerLightBallScale,
    pointerSphereColor,
    pointerSphereOpacity,
    pointerSphereRoughness,
    pointerSphereMetalness,
    pointerSphereEmissiveColor,
    pointerSphereEmissiveIntensity,
    pointerSphereWireframe,
    pointerMagicGlassColor,
    pointerMagicGlassOpacity,
    pointerMagicGlassTransmission,
    pointerMagicGlassThickness,
    pointerMagicGlassRoughness,
    pointerMagicGlassIor,
    pointerMagicGlassChromaticAberration,
    pointerMagicGlassAnisotropy,
    pointerMagicGlassDistortion,
    pointerMagicGlassDistortionScale,
    pointerMagicGlassTemporalDistortion,
    pointerMagicGlassAttenuationColor,
    pointerMagicGlassAttenuationDistance,
  } = useQuinnsDiceControls();
  rollPowerRef.current = rollPower;
  rollDelayRef.current = rollRejoinDelaySeconds;
  orbitControlsEnabledRef.current = orbitControlsEnabled;
  rollLaneZRef.current = boxDepth * 0.35;

  const { boundsWidth, boundsHeight } = useMemo(() => {
    const fovRad = 24 * (Math.PI / 180);
    const cameraZ = DEFAULT_CAMERA_POSITION_VALUES[2];
    const aspect = size.width / size.height;
    const visibleHeight = 2 * Math.tan(fovRad / 2) * cameraZ;
    return { boundsWidth: visibleHeight * aspect, boundsHeight: visibleHeight };
  }, [size.width, size.height]);

  useEffect(() => {
    if (!orbitControlsEnabled || rollingDieIdRef.current) return;
    if (!pendingRollDieIdRef.current) return;
    const nextDieId = pendingRollDieIdRef.current;
    pendingRollDieIdRef.current = null;
    executeRoll(nextDieId);
  }, [executeRoll, orbitControlsEnabled]);

  useFrame((_, delta) => {
    if (pendingRollDieIdRef.current && !rollingDieIdRef.current) {
      const cam = cameraRef.current;
      if (cam && cam.position.distanceTo(DEFAULT_CAMERA_POSITION) < 0.35) {
        const nextDieId = pendingRollDieIdRef.current;
        pendingRollDieIdRef.current = null;
        executeRoll(nextDieId);
      }
    }

    if (!rollingDieIdRef.current && detachedDieIdRef.current) {
      rejoinTimerRef.current = Math.max(0, rejoinTimerRef.current - delta);
      if (rejoinTimerRef.current === 0) {
        detachedDieIdRef.current = null;
        focusedDieIdRef.current = null;
      }
    }

    const cam = cameraRef.current;
    if (!cam) return;
    if (orbitControlsEnabledRef.current) return;

    const focusBody = focusedDieIdRef.current
      ? dieRefMap[focusedDieIdRef.current]?.current
      : null;
    const positionTarget = cameraPositionTargetRef.current.copy(
      DEFAULT_CAMERA_POSITION
    );
    const lookAtTarget = cameraLookAtTargetRef.current.copy(
      CAMERA_DEFAULT_LOOK_AT
    );

    if (focusBody) {
      const t = focusBody.translation();
      lookAtTarget.set(t.x, t.y, t.z);
      if (rollingDieIdRef.current) {
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
        position={MAIN_LIGHT_POSITION}
        angle={Math.PI / 3}
        penumbra={1}
        intensity={1.25}
        distance={70}
        decay={2}
        castShadow
      />
      {debugLights && (
        <LightDebugPyramid
          position={MAIN_LIGHT_POSITION}
          target={MAIN_LIGHT_TARGET}
        />
      )}
      <Physics
        gravity={[0, 0, 0]}
        debug={debug}
        paused={!physicsEnabled}
        timeStep={1 / 60}
        interpolate
      >
        <DicePhysicsDriver
          dieRefMap={dieRefMap}
          detachedDieIdRef={detachedDieIdRef}
          rollingDieIdRef={rollingDieIdRef}
          physicsEnabled={physicsEnabled}
          returnStrength={returnStrength}
          linearDamping={linearDamping}
          maxImpulse={maxImpulse}
          boundsWidth={boundsWidth}
          boundsHeight={boundsHeight}
          boundsDepth={boxDepth}
          targetX={targetX}
          targetY={targetY}
          targetZ={targetZ}
        />
        <SceneBounds
          width={boundsWidth}
          height={boundsHeight}
          depth={boxDepth}
          onBottomCollisionEnter={handleBottomPlaneCollision}
        />
        {mode === 'auto' && (
          <AutoPointer
            radius={pointerRadius}
            autoSpeed={autoSpeed}
            followSpeed={pointerFollowSpeed}
            boxWidth={boundsWidth}
            boxHeight={boundsHeight}
            boxDepth={boxDepth}
            look={pointerLook}
            lightColor={pointerLightColor}
            lightIntensity={pointerLightIntensity}
            lightDistance={pointerLightDistance}
            lightDecay={pointerLightDecay}
            lightBallScale={pointerLightBallScale}
            sphereColor={pointerSphereColor}
            sphereOpacity={pointerSphereOpacity}
            sphereRoughness={pointerSphereRoughness}
            sphereMetalness={pointerSphereMetalness}
            sphereEmissiveColor={pointerSphereEmissiveColor}
            sphereEmissiveIntensity={pointerSphereEmissiveIntensity}
            sphereWireframe={pointerSphereWireframe}
            magicGlassColor={pointerMagicGlassColor}
            magicGlassOpacity={pointerMagicGlassOpacity}
            magicGlassTransmission={pointerMagicGlassTransmission}
            magicGlassThickness={pointerMagicGlassThickness}
            magicGlassRoughness={pointerMagicGlassRoughness}
            magicGlassIor={pointerMagicGlassIor}
            magicGlassChromaticAberration={pointerMagicGlassChromaticAberration}
            magicGlassAnisotropy={pointerMagicGlassAnisotropy}
            magicGlassDistortion={pointerMagicGlassDistortion}
            magicGlassDistortionScale={pointerMagicGlassDistortionScale}
            magicGlassTemporalDistortion={pointerMagicGlassTemporalDistortion}
            magicGlassAttenuationColor={pointerMagicGlassAttenuationColor}
            magicGlassAttenuationDistance={pointerMagicGlassAttenuationDistance}
          />
        )}
        {mode === 'touch/pointer' && (
          <Pointer
            radius={pointerRadius}
            followSpeed={pointerFollowSpeed}
            boxWidth={boundsWidth}
            boxHeight={boundsHeight}
            boxDepth={boxDepth}
            look={pointerLook}
            lightColor={pointerLightColor}
            lightIntensity={pointerLightIntensity}
            lightDistance={pointerLightDistance}
            lightDecay={pointerLightDecay}
            lightBallScale={pointerLightBallScale}
            sphereColor={pointerSphereColor}
            sphereOpacity={pointerSphereOpacity}
            sphereRoughness={pointerSphereRoughness}
            sphereMetalness={pointerSphereMetalness}
            sphereEmissiveColor={pointerSphereEmissiveColor}
            sphereEmissiveIntensity={pointerSphereEmissiveIntensity}
            sphereWireframe={pointerSphereWireframe}
            magicGlassColor={pointerMagicGlassColor}
            magicGlassOpacity={pointerMagicGlassOpacity}
            magicGlassTransmission={pointerMagicGlassTransmission}
            magicGlassThickness={pointerMagicGlassThickness}
            magicGlassRoughness={pointerMagicGlassRoughness}
            magicGlassIor={pointerMagicGlassIor}
            magicGlassChromaticAberration={pointerMagicGlassChromaticAberration}
            magicGlassAnisotropy={pointerMagicGlassAnisotropy}
            magicGlassDistortion={pointerMagicGlassDistortion}
            magicGlassDistortionScale={pointerMagicGlassDistortionScale}
            magicGlassTemporalDistortion={pointerMagicGlassTemporalDistortion}
            magicGlassAttenuationColor={pointerMagicGlassAttenuationColor}
            magicGlassAttenuationDistance={pointerMagicGlassAttenuationDistance}
          />
        )}
        {mode === 'hands' && (
          <HandsPointer
            radius={pointerRadius}
            boxWidth={boundsWidth}
            boxHeight={boundsHeight}
            boxDepth={boxDepth}
            look={pointerLook}
            lightColor={pointerLightColor}
            lightIntensity={pointerLightIntensity}
            lightDistance={pointerLightDistance}
            lightDecay={pointerLightDecay}
            lightBallScale={pointerLightBallScale}
            sphereColor={pointerSphereColor}
            sphereOpacity={pointerSphereOpacity}
            sphereRoughness={pointerSphereRoughness}
            sphereMetalness={pointerSphereMetalness}
            sphereEmissiveColor={pointerSphereEmissiveColor}
            sphereEmissiveIntensity={pointerSphereEmissiveIntensity}
            sphereWireframe={pointerSphereWireframe}
            magicGlassColor={pointerMagicGlassColor}
            magicGlassOpacity={pointerMagicGlassOpacity}
            magicGlassTransmission={pointerMagicGlassTransmission}
            magicGlassThickness={pointerMagicGlassThickness}
            magicGlassRoughness={pointerMagicGlassRoughness}
            magicGlassIor={pointerMagicGlassIor}
            magicGlassChromaticAberration={pointerMagicGlassChromaticAberration}
            magicGlassAnisotropy={pointerMagicGlassAnisotropy}
            magicGlassDistortion={pointerMagicGlassDistortion}
            magicGlassDistortionScale={pointerMagicGlassDistortionScale}
            magicGlassTemporalDistortion={pointerMagicGlassTemporalDistortion}
            magicGlassAttenuationColor={pointerMagicGlassAttenuationColor}
            magicGlassAttenuationDistance={pointerMagicGlassAttenuationDistance}
            showVideo={handsShowVideo}
            showDebugSkeleton={handsShowDebugSkeleton}
            videoSize={handsVideoSize}
            cameraWidth={handsCameraWidth}
            cameraHeight={handsCameraHeight}
            xScale={handsXScale}
            yScale={handsYScale}
            zScale={handsZScale}
            landmarkColor={handsLandmarkColor}
            connectorColor={handsConnectorColor}
            landmarkRadius={handsLandmarkRadius}
            connectorLineWidth={handsConnectorLineWidth}
            enableGestures={handsEnableGestures}
            pointRollEnabled={handsPointRollEnabled}
            pointRollCooldownMs={handsPointRollCooldownMs}
          />
        )}
        <D4Die
          bodyRef={d4Ref}
          scale={d4Scale}
          linearDamping={linearDamping}
          angularDamping={angularDamping}
          friction={friction}
        />
        <D6Die
          bodyRef={d6Ref}
          scale={d6Scale}
          linearDamping={linearDamping}
          angularDamping={angularDamping}
          friction={friction}
        />
        <D8Die
          bodyRef={d8Ref}
          scale={d8Scale}
          linearDamping={linearDamping}
          angularDamping={angularDamping}
          friction={friction}
        />
        <D10Die
          bodyRef={d10Ref}
          scale={d10Scale}
          linearDamping={linearDamping}
          angularDamping={angularDamping}
          friction={friction}
        />
        <D12Die
          bodyRef={d12Ref}
          scale={d12Scale}
          linearDamping={linearDamping}
          angularDamping={angularDamping}
          friction={friction}
        />
        <D20Die
          bodyRef={d20Ref}
          scale={d20Scale}
          emissiveColor={d20EmissiveColor}
          emissiveIntensity={d20EmissiveIntensity}
          linearDamping={linearDamping}
          angularDamping={angularDamping}
          friction={friction}
        />
      </Physics>
      <EffectComposer disableNormalPass multisampling={4}>
        <N8AO distanceFalloff={1} aoRadius={1} intensity={4} />
        {bloomEnabled && (
          <Bloom
            intensity={bloomIntensity}
            luminanceThreshold={bloomLuminanceThreshold}
            luminanceSmoothing={bloomLuminanceSmoothing}
            mipmapBlur
            radius={bloomRadius}
          />
        )}
      </EffectComposer>
      <SceneLighting />
      {debugLights && (
        <group rotation={[-Math.PI / 3, 0, 1]}>
          {LIGHTFORMER_CONFIGS.map((config, index) => (
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

const DicePhysicsDriver = React.memo(function DicePhysicsDriver({
  dieRefMap,
  detachedDieIdRef,
  rollingDieIdRef,
  physicsEnabled,
  returnStrength,
  linearDamping,
  maxImpulse,
  boundsWidth,
  boundsHeight,
  boundsDepth,
  targetX,
  targetY,
  targetZ,
}) {
  const velocityRef = useRef(new THREE.Vector3());
  const targetVelocityRef = useRef(new THREE.Vector3());
  const correctedTranslationRef = useRef(new THREE.Vector3());
  const correctedVelocityRef = useRef(new THREE.Vector3());

  useBeforePhysicsStep(() => {
    if (!physicsEnabled) return;

    const velocity = velocityRef.current;
    const targetVelocity = targetVelocityRef.current;
    const dt = 1 / 60;
    const settleDistanceSq = 0.0009;
    const settleSpeedSq = 0.0009;
    const baseFollow = Math.max(0, returnStrength) * 2.2;
    const followRate = Math.max(0.4, baseFollow);
    const dampingRate = Math.max(0.2, linearDamping * 0.55);
    const blend = 1 - Math.exp(-followRate * dt);
    const dampingFactor = Math.exp(-dampingRate * dt);
    const maxReturnSpeed = Math.max(0.2, maxImpulse * 10);
    const boundaryPadding = 0.65;
    const xLimit = Math.max(0.2, boundsWidth / 2 - boundaryPadding);
    const yLimit = Math.max(0.2, boundsHeight / 2 - boundaryPadding);
    const zLimit = Math.max(0.2, boundsDepth / 2 - boundaryPadding);
    const correctionSpeed = Math.max(1.8, maxReturnSpeed * 0.7);
    const correctedTranslation = correctedTranslationRef.current;
    const correctedVelocity = correctedVelocityRef.current;

    for (let i = 0; i < DIE_IDS.length; i += 1) {
      const id = DIE_IDS[i];
      const body = dieRefMap[id]?.current;
      if (body) {
        const translation = body.translation();
        const linearVelocity = body.linvel();
        const clampedX = THREE.MathUtils.clamp(translation.x, -xLimit, xLimit);
        const clampedY = THREE.MathUtils.clamp(translation.y, -yLimit, yLimit);
        const clampedZ = THREE.MathUtils.clamp(translation.z, -zLimit, zLimit);
        const correctedX = clampedX !== translation.x;
        const correctedY = clampedY !== translation.y;
        const correctedZ = clampedZ !== translation.z;

        if (correctedX || correctedY || correctedZ) {
          correctedTranslation.set(clampedX, clampedY, clampedZ);
          body.setTranslation(correctedTranslation, false);

          correctedVelocity.set(
            correctedX
              ? -Math.sign(translation.x) *
                  Math.max(correctionSpeed, Math.abs(linearVelocity.x) * 0.35)
              : linearVelocity.x,
            correctedY
              ? -Math.sign(translation.y) *
                  Math.max(correctionSpeed, Math.abs(linearVelocity.y) * 0.35)
              : linearVelocity.y,
            correctedZ
              ? -Math.sign(translation.z) *
                  Math.max(correctionSpeed, Math.abs(linearVelocity.z) * 0.35)
              : linearVelocity.z
          );
          body.setLinvel(correctedVelocity, false);
        }

        if (detachedDieIdRef.current !== id) {
          const dx = targetX - clampedX;
          const dy = targetY - clampedY;
          const dz = targetZ - clampedZ;
          const displacementSq = dx * dx + dy * dy + dz * dz;
          const velocitySq =
            linearVelocity.x ** 2 +
            linearVelocity.y ** 2 +
            linearVelocity.z ** 2;

          if (displacementSq < settleDistanceSq && velocitySq < settleSpeedSq) {
            body.setLinvel(ZERO_VEL, false);
          } else {
            targetVelocity.set(dx, dy, dz).multiplyScalar(followRate);
            if (targetVelocity.lengthSq() > maxReturnSpeed * maxReturnSpeed) {
              targetVelocity.setLength(maxReturnSpeed);
            }

            velocity.set(linearVelocity.x, linearVelocity.y, linearVelocity.z);
            velocity.lerp(targetVelocity, blend).multiplyScalar(dampingFactor);
            body.setLinvel(velocity, false);
          }
        }
      }
    }

    if (rollingDieIdRef.current) {
      const rollingBody = dieRefMap[rollingDieIdRef.current]?.current;
      if (rollingBody) {
        rollingBody.applyImpulse(GRAVITY_IMPULSE, false);
      }
    }
  });

  return null;
});

const SceneLighting = React.memo(function SceneLighting() {
  return (
    <Environment preset="city" resolution={256}>
      <group rotation={[-Math.PI / 3, 0, 1]}>
        {LIGHTFORMER_CONFIGS.map((config, index) => (
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
  );
});

const SceneBackground = React.memo(function SceneBackground({
  topColor,
  bottomColor,
}) {
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

  useLayoutEffect(
    () => () => {
      if (textureRef.current) textureRef.current.dispose();
      textureRef.current = null;
      scene.background = null;
      gl.setClearColor(0x000000, 0);
      gl.clear(true, true, true);
    },
    [gl, scene]
  );

  return null;
});

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

const SceneBounds = React.memo(function SceneBounds({
  width = 30,
  height = 30,
  depth = 30,
  onBottomCollisionEnter,
}) {
  const halfW = width / 2;
  const halfH = height / 2;
  const halfD = depth / 2;
  const wallThickness = 0.5;

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
        <planeGeometry args={[100, 100]} />
        <shadowMaterial transparent opacity={0.3} />
      </mesh>
    </RigidBody>
  );
});

function DieBody({
  name,
  position,
  children,
  rigidScale = 1,
  bodyRef,
  linearDamping = 4,
  angularDamping = 1,
  friction = 0.1,
  colliders = false,
  restitution = 0.05,
  softCcdPrediction = 0.35,
}) {
  const internalRef = useRef();
  const api = bodyRef || internalRef;
  const pos = useMemo(() => position || [0, 0, 0], [position]);
  return (
    <RigidBody
      key={`${name}-${rigidScale}`}
      name={name}
      linearDamping={linearDamping}
      angularDamping={angularDamping}
      friction={friction}
      restitution={restitution}
      position={pos}
      scale={rigidScale}
      ref={api}
      colliders={colliders}
      canSleep
      ccd
      softCcdPrediction={softCcdPrediction}
    >
      {children}
    </RigidBody>
  );
}

const D4Die = React.memo(function D4Die({ scale = 1, bodyRef, ...props }) {
  const { position } = DICE_CONFIGS[0];
  return (
    <DieBody
      name="d4"
      position={position}
      rigidScale={scale}
      bodyRef={bodyRef}
      colliders="hull"
      {...props}
    >
      <Center>
        <QuinnsD4 />
      </Center>
    </DieBody>
  );
});

const D6Die = React.memo(function D6Die({ scale = 1, bodyRef, ...props }) {
  const { position } = DICE_CONFIGS[1];
  return (
    <DieBody
      name="d6"
      position={position}
      rigidScale={scale}
      bodyRef={bodyRef}
      colliders="hull"
      {...props}
    >
      <Center>
        <QuinnsD6 />
      </Center>
    </DieBody>
  );
});

const D8Die = React.memo(function D8Die({ scale = 1, bodyRef, ...props }) {
  const { position } = DICE_CONFIGS[2];
  return (
    <DieBody
      name="d8"
      position={position}
      rigidScale={scale}
      bodyRef={bodyRef}
      colliders="hull"
      {...props}
    >
      <Center>
        <QuinnsD8 />
      </Center>
    </DieBody>
  );
});

const D10Die = React.memo(function D10Die({ scale = 1, bodyRef, ...props }) {
  const { position } = DICE_CONFIGS[3];
  return (
    <DieBody
      name="d10"
      position={position}
      rigidScale={scale}
      bodyRef={bodyRef}
      colliders="hull"
      {...props}
    >
      <Center>
        <QuinnsD10 />
      </Center>
    </DieBody>
  );
});

const D12Die = React.memo(function D12Die({ scale = 1, bodyRef, ...props }) {
  const { position } = DICE_CONFIGS[4];
  return (
    <DieBody
      name="d12"
      position={position}
      rigidScale={scale}
      bodyRef={bodyRef}
      colliders="hull"
      {...props}
    >
      <Center>
        <QuinnsD12 />
      </Center>
    </DieBody>
  );
});

const D20Die = React.memo(function D20Die({
  bodyRef,
  scale = 1,
  emissiveColor = '#ffffff',
  emissiveIntensity = 1,
  ...props
}) {
  const { position } = DICE_CONFIGS[5];
  return (
    <DieBody
      name="d20"
      position={position}
      rigidScale={scale}
      bodyRef={bodyRef}
      colliders="hull"
      {...props}
    >
      <Center>
        <D20Visual
          emissiveColor={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </Center>
    </DieBody>
  );
});

const D20Visual = React.memo(function D20Visual({
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
    <group ref={groupRef}>
      <QuinnsD20 />
    </group>
  );
});

const PointerAppearance = React.memo(function PointerAppearance({
  radius,
  look,
  lightColor,
  lightIntensity,
  lightDistance,
  lightDecay,
  lightBallScale,
  sphereColor,
  sphereOpacity,
  sphereRoughness,
  sphereMetalness,
  sphereEmissiveColor,
  sphereEmissiveIntensity,
  sphereWireframe,
  magicGlassColor,
  magicGlassOpacity,
  magicGlassTransmission,
  magicGlassThickness,
  magicGlassRoughness,
  magicGlassIor,
  magicGlassChromaticAberration,
  magicGlassAnisotropy,
  magicGlassDistortion,
  magicGlassDistortionScale,
  magicGlassTemporalDistortion,
  magicGlassAttenuationColor,
  magicGlassAttenuationDistance,
}) {
  const safeAttenuationDistance =
    magicGlassAttenuationDistance <= 0 ? 1000 : magicGlassAttenuationDistance;

  return (
    <>
      {look === 'sphere' && (
        <mesh scale={radius}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshStandardMaterial
            color={sphereColor}
            transparent={sphereOpacity < 1}
            opacity={sphereOpacity}
            roughness={sphereRoughness}
            metalness={sphereMetalness}
            emissive={sphereEmissiveColor}
            emissiveIntensity={sphereEmissiveIntensity}
            wireframe={sphereWireframe}
          />
        </mesh>
      )}
      {look === 'light' && (
        <mesh scale={radius * lightBallScale}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial color={lightColor} toneMapped={false} />
          <pointLight
            color={lightColor}
            intensity={lightIntensity}
            distance={lightDistance}
            decay={lightDecay}
          />
        </mesh>
      )}
      {look === 'magicGlass' && (
        <group>
          <mesh scale={radius}>
            <sphereGeometry args={[1, 32, 32]} />
            <MeshTransmissionMaterial
              color={magicGlassColor}
              transmissionSampler
              samples={2}
              resolution={128}
              transmission={magicGlassTransmission}
              thickness={magicGlassThickness}
              roughness={magicGlassRoughness}
              ior={magicGlassIor}
              chromaticAberration={magicGlassChromaticAberration}
              anisotropy={magicGlassAnisotropy}
              distortion={magicGlassDistortion}
              distortionScale={magicGlassDistortionScale}
              temporalDistortion={magicGlassTemporalDistortion}
              attenuationColor={magicGlassAttenuationColor}
              attenuationDistance={safeAttenuationDistance}
              transparent={magicGlassOpacity < 1}
              opacity={magicGlassOpacity}
            />
          </mesh>
          <mesh scale={radius * lightBallScale}>
            <sphereGeometry args={[1, 12, 12]} />
            <meshBasicMaterial color={lightColor} toneMapped={false} />
            <pointLight
              color={lightColor}
              intensity={lightIntensity}
              distance={lightDistance}
              decay={lightDecay}
            />
          </mesh>
        </group>
      )}
    </>
  );
});

const Pointer = React.memo(function Pointer({
  radius = 1,
  followSpeed = 30,
  boxWidth = 10,
  boxHeight = 10,
  boxDepth = 10,
  look = 'light',
  lightColor = '#ffffff',
  lightIntensity = 8,
  lightDistance = 10,
  lightDecay = 2,
  lightBallScale = 0.35,
  sphereColor = '#ffffff',
  sphereOpacity = 1,
  sphereRoughness = 0.35,
  sphereMetalness = 0,
  sphereEmissiveColor = '#000000',
  sphereEmissiveIntensity = 0,
  sphereWireframe = false,
  magicGlassColor = '#ffffff',
  magicGlassOpacity = 1,
  magicGlassTransmission = 1,
  magicGlassThickness = 0.9,
  magicGlassRoughness = 0.03,
  magicGlassIor = 1.25,
  magicGlassChromaticAberration = 0.08,
  magicGlassAnisotropy = 0.05,
  magicGlassDistortion = 0,
  magicGlassDistortionScale = 0.3,
  magicGlassTemporalDistortion = 0,
  magicGlassAttenuationColor = '#ffffff',
  magicGlassAttenuationDistance = 0,
}) {
  const ref = useRef();
  const smoothedPosRef = useRef(new THREE.Vector3());
  const targetPosRef = useRef(new THREE.Vector3());

  useFrame(({ mouse, viewport }, delta) => {
    const body = ref.current;
    if (!body) return;

    const halfW = boxWidth / 2;
    const halfH = boxHeight / 2;
    const halfD = boxDepth / 2;
    const margin = radius + 0.35;
    const targetX = THREE.MathUtils.clamp(
      (mouse.x * viewport.width) / 2,
      -halfW + margin,
      halfW - margin
    );
    const targetY = THREE.MathUtils.clamp(
      (mouse.y * viewport.height) / 2,
      -halfH + margin,
      halfH - margin
    );
    const targetZ = THREE.MathUtils.clamp(0, -halfD + margin, halfD - margin);
    const target = targetPosRef.current.set(targetX, targetY, targetZ);
    const smoothingAlpha = 1 - Math.exp(-Math.max(0, followSpeed) * delta);

    smoothedPosRef.current.lerp(target, smoothingAlpha);

    body.setNextKinematicTranslation(smoothedPosRef.current);
  });

  useEffect(() => {
    smoothedPosRef.current.set(0, 0, 0);
  }, []);

  return (
    <RigidBody
      position={[0, 0, 0]}
      type="kinematicPosition"
      colliders={false}
      ref={ref}
    >
      <BallCollider args={[radius]} />
      <PointerAppearance
        radius={radius}
        look={look}
        lightColor={lightColor}
        lightIntensity={lightIntensity}
        lightDistance={lightDistance}
        lightDecay={lightDecay}
        lightBallScale={lightBallScale}
        sphereColor={sphereColor}
        sphereOpacity={sphereOpacity}
        sphereRoughness={sphereRoughness}
        sphereMetalness={sphereMetalness}
        sphereEmissiveColor={sphereEmissiveColor}
        sphereEmissiveIntensity={sphereEmissiveIntensity}
        sphereWireframe={sphereWireframe}
        magicGlassColor={magicGlassColor}
        magicGlassOpacity={magicGlassOpacity}
        magicGlassTransmission={magicGlassTransmission}
        magicGlassThickness={magicGlassThickness}
        magicGlassRoughness={magicGlassRoughness}
        magicGlassIor={magicGlassIor}
        magicGlassChromaticAberration={magicGlassChromaticAberration}
        magicGlassAnisotropy={magicGlassAnisotropy}
        magicGlassDistortion={magicGlassDistortion}
        magicGlassDistortionScale={magicGlassDistortionScale}
        magicGlassTemporalDistortion={magicGlassTemporalDistortion}
        magicGlassAttenuationColor={magicGlassAttenuationColor}
        magicGlassAttenuationDistance={magicGlassAttenuationDistance}
      />
    </RigidBody>
  );
});

const AutoPointer = React.memo(function AutoPointer({
  radius = 1,
  autoSpeed = 0.6,
  followSpeed = 30,
  boxWidth = 10,
  boxHeight = 10,
  boxDepth = 10,
  look = 'light',
  lightColor = '#ffffff',
  lightIntensity = 8,
  lightDistance = 10,
  lightDecay = 2,
  lightBallScale = 0.35,
  sphereColor = '#ffffff',
  sphereOpacity = 1,
  sphereRoughness = 0.35,
  sphereMetalness = 0,
  sphereEmissiveColor = '#000000',
  sphereEmissiveIntensity = 0,
  sphereWireframe = false,
  magicGlassColor = '#ffffff',
  magicGlassOpacity = 1,
  magicGlassTransmission = 1,
  magicGlassThickness = 0.9,
  magicGlassRoughness = 0.03,
  magicGlassIor = 1.25,
  magicGlassChromaticAberration = 0.08,
  magicGlassAnisotropy = 0.05,
  magicGlassDistortion = 0,
  magicGlassDistortionScale = 0.3,
  magicGlassTemporalDistortion = 0,
  magicGlassAttenuationColor = '#ffffff',
  magicGlassAttenuationDistance = 0,
}) {
  const ref = useRef();
  const smoothedPosRef = useRef(new THREE.Vector3());
  const targetPosRef = useRef(new THREE.Vector3());
  const tRef = useRef(0);

  useFrame((_, delta) => {
    const body = ref.current;
    if (!body) return;

    tRef.current += delta * autoSpeed;
    const t = tRef.current;
    const sinT = Math.sin(t);
    const cosT = Math.cos(t);
    const denom = 1 + sinT * sinT;

    const halfW = boxWidth / 2;
    const halfH = boxHeight / 2;
    const margin = radius + 0.35;
    const rangeX = halfW - margin;
    const rangeY = halfH - margin;

    const targetX = (cosT / denom) * rangeX;
    const targetY = ((sinT * cosT) / denom) * rangeY;
    const target = targetPosRef.current.set(targetX, targetY, 0);

    const smoothingAlpha = 1 - Math.exp(-Math.max(0, followSpeed) * delta);
    smoothedPosRef.current.lerp(target, smoothingAlpha);
    body.setNextKinematicTranslation(smoothedPosRef.current);
  });

  useEffect(() => {
    smoothedPosRef.current.set(0, 0, 0);
  }, []);

  return (
    <RigidBody
      position={[0, 0, 0]}
      type="kinematicPosition"
      colliders={false}
      ref={ref}
    >
      <BallCollider args={[radius]} />
      <PointerAppearance
        radius={radius}
        look={look}
        lightColor={lightColor}
        lightIntensity={lightIntensity}
        lightDistance={lightDistance}
        lightDecay={lightDecay}
        lightBallScale={lightBallScale}
        sphereColor={sphereColor}
        sphereOpacity={sphereOpacity}
        sphereRoughness={sphereRoughness}
        sphereMetalness={sphereMetalness}
        sphereEmissiveColor={sphereEmissiveColor}
        sphereEmissiveIntensity={sphereEmissiveIntensity}
        sphereWireframe={sphereWireframe}
        magicGlassColor={magicGlassColor}
        magicGlassOpacity={magicGlassOpacity}
        magicGlassTransmission={magicGlassTransmission}
        magicGlassThickness={magicGlassThickness}
        magicGlassRoughness={magicGlassRoughness}
        magicGlassIor={magicGlassIor}
        magicGlassChromaticAberration={magicGlassChromaticAberration}
        magicGlassAnisotropy={magicGlassAnisotropy}
        magicGlassDistortion={magicGlassDistortion}
        magicGlassDistortionScale={magicGlassDistortionScale}
        magicGlassTemporalDistortion={magicGlassTemporalDistortion}
        magicGlassAttenuationColor={magicGlassAttenuationColor}
        magicGlassAttenuationDistance={magicGlassAttenuationDistance}
      />
    </RigidBody>
  );
});

const HandsPointer = React.memo(function HandsPointer({
  radius = 1,
  boxWidth = 10,
  boxHeight = 10,
  boxDepth = 10,
  look = 'light',
  lightColor = '#ffffff',
  lightIntensity = 8,
  lightDistance = 10,
  lightDecay = 2,
  lightBallScale = 0.35,
  sphereColor = '#ffffff',
  sphereOpacity = 1,
  sphereRoughness = 0.35,
  sphereMetalness = 0,
  sphereEmissiveColor = '#000000',
  sphereEmissiveIntensity = 0,
  sphereWireframe = false,
  magicGlassColor = '#ffffff',
  magicGlassOpacity = 1,
  magicGlassTransmission = 1,
  magicGlassThickness = 0.9,
  magicGlassRoughness = 0.03,
  magicGlassIor = 1.25,
  magicGlassChromaticAberration = 0.08,
  magicGlassAnisotropy = 0.05,
  magicGlassDistortion = 0,
  magicGlassDistortionScale = 0.3,
  magicGlassTemporalDistortion = 0,
  magicGlassAttenuationColor = '#ffffff',
  magicGlassAttenuationDistance = 0,
  xScale = 4,
  yScale = 3,
  zScale = 5,
  cameraWidth = 1280,
  cameraHeight = 720,
  showVideo = false,
  showDebugSkeleton = true,
  videoSize = 1,
  landmarkColor = '#FF3366',
  connectorColor = '#00FFAA',
  landmarkRadius = 4,
  connectorLineWidth = 3,
  enableGestures = true,
  pointRollEnabled = true,
  pointRollCooldownMs = 900,
}) {
  const ref = useRef();
  const vecRef = useRef(new THREE.Vector3());
  const smoothedHandPosRef = useRef(new THREE.Vector3(999, 999, 999));
  const lastPointRollAtRef = useRef(0);

  const results = useMediaPipeHands({
    maxHands: 1,
    cameraWidth,
    cameraHeight,
    showVideo,
    showDebugSkeleton,
    landmarkStyle: { color: landmarkColor, radius: landmarkRadius },
    connectorStyle: { color: connectorColor, lineWidth: connectorLineWidth },
    videoSize,
  });

  const hands = useHandControls(results, {
    maxHands: 1,
    xScale,
    yScale,
    zScale,
  });

  useHandGestureEvents(hands, {
    onGestureStart: (gesture) => {
      if (!enableGestures || !pointRollEnabled) return;
      if (gesture !== 'POINT') return;

      const now = Date.now();
      if (now - lastPointRollAtRef.current < pointRollCooldownMs) return;
      lastPointRollAtRef.current = now;

      if (typeof window === 'undefined') return;
      window.dispatchEvent(
        new CustomEvent(ROLL_DIE_EVENT, { detail: { target: 'random' } })
      );
    },
  });

  useFrame(() => {
    const body = ref.current;
    if (!body) return;
    const vec = vecRef.current;

    if (!hands?.handPosition) {
      body.setNextKinematicTranslation(vec.set(999, 999, 999));
      return;
    }

    const halfW = boxWidth / 2;
    const halfH = boxHeight / 2;
    const halfD = boxDepth / 2;
    const margin = radius + 0.35;
    vec
      .copy(hands.handPosition)
      .set(
        THREE.MathUtils.clamp(vec.x, -halfW + margin, halfW - margin),
        THREE.MathUtils.clamp(vec.y, -halfH + margin, halfH - margin),
        THREE.MathUtils.clamp(vec.z, -halfD + margin, halfD - margin)
      );

    smoothedHandPosRef.current.lerp(vec, 0.3);
    body.setNextKinematicTranslation(smoothedHandPosRef.current);
  });

  return (
    <RigidBody
      position={[999, 999, 999]}
      type="kinematicPosition"
      colliders={false}
      ref={ref}
    >
      <BallCollider args={[radius]} />
      <PointerAppearance
        radius={radius}
        look={look}
        lightColor={lightColor}
        lightIntensity={lightIntensity}
        lightDistance={lightDistance}
        lightDecay={lightDecay}
        lightBallScale={lightBallScale}
        sphereColor={sphereColor}
        sphereOpacity={sphereOpacity}
        sphereRoughness={sphereRoughness}
        sphereMetalness={sphereMetalness}
        sphereEmissiveColor={sphereEmissiveColor}
        sphereEmissiveIntensity={sphereEmissiveIntensity}
        sphereWireframe={sphereWireframe}
        magicGlassColor={magicGlassColor}
        magicGlassOpacity={magicGlassOpacity}
        magicGlassTransmission={magicGlassTransmission}
        magicGlassThickness={magicGlassThickness}
        magicGlassRoughness={magicGlassRoughness}
        magicGlassIor={magicGlassIor}
        magicGlassChromaticAberration={magicGlassChromaticAberration}
        magicGlassAnisotropy={magicGlassAnisotropy}
        magicGlassDistortion={magicGlassDistortion}
        magicGlassDistortionScale={magicGlassDistortionScale}
        magicGlassTemporalDistortion={magicGlassTemporalDistortion}
        magicGlassAttenuationColor={magicGlassAttenuationColor}
        magicGlassAttenuationDistance={magicGlassAttenuationDistance}
      />
    </RigidBody>
  );
});
