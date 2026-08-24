import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, N8AO } from '@react-three/postprocessing';
import { Physics } from '@react-three/rapier';

import * as THREE from 'three';

import {
  D4Die,
  D6Die,
  D8Die,
  D10Die,
  D12Die,
  D20Die,
  SceneBounds,
} from './components/DiceBodies';
import DicePhysicsDriver from './components/DicePhysicsDriver';
import { AutoPointer, HandsPointer, Pointer } from './components/DicePointers';
import {
  LightDebugPyramid,
  LightformerDebugPyramid,
  SceneBackground,
  SceneLighting,
} from './components/SceneEnvironment';
import useQuinnsDiceControls from './hooks/useQuinnsDiceControls';
import {
  DEFAULT_CAMERA_POSITION_VALUES,
  LIGHTFORMER_CONFIGS,
  MAIN_LIGHT_POSITION,
  MAIN_LIGHT_TARGET,
  RESET_GRID_EVENT,
  RESET_GRID_POSITIONS,
  ROLL_DIE_EVENT,
} from './presets/QuinnsDice.sceneSettings';

const DEFAULT_CAMERA_POSITION = new THREE.Vector3(
  ...DEFAULT_CAMERA_POSITION_VALUES
);
const CAMERA_DEFAULT_LOOK_AT = new THREE.Vector3(0, 0, 0);

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
    aoEnabled,
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

  const sharedPointerProps = {
    radius: pointerRadius,
    followSpeed: pointerFollowSpeed,
    boxWidth: boundsWidth,
    boxHeight: boundsHeight,
    boxDepth,
    look: pointerLook,
    lightColor: pointerLightColor,
    lightIntensity: pointerLightIntensity,
    lightDistance: pointerLightDistance,
    lightDecay: pointerLightDecay,
    lightBallScale: pointerLightBallScale,
    sphereColor: pointerSphereColor,
    sphereOpacity: pointerSphereOpacity,
    sphereRoughness: pointerSphereRoughness,
    sphereMetalness: pointerSphereMetalness,
    sphereEmissiveColor: pointerSphereEmissiveColor,
    sphereEmissiveIntensity: pointerSphereEmissiveIntensity,
    sphereWireframe: pointerSphereWireframe,
    magicGlassColor: pointerMagicGlassColor,
    magicGlassOpacity: pointerMagicGlassOpacity,
    magicGlassTransmission: pointerMagicGlassTransmission,
    magicGlassThickness: pointerMagicGlassThickness,
    magicGlassRoughness: pointerMagicGlassRoughness,
    magicGlassIor: pointerMagicGlassIor,
    magicGlassChromaticAberration: pointerMagicGlassChromaticAberration,
    magicGlassAnisotropy: pointerMagicGlassAnisotropy,
    magicGlassDistortion: pointerMagicGlassDistortion,
    magicGlassDistortionScale: pointerMagicGlassDistortionScale,
    magicGlassTemporalDistortion: pointerMagicGlassTemporalDistortion,
    magicGlassAttenuationColor: pointerMagicGlassAttenuationColor,
    magicGlassAttenuationDistance: pointerMagicGlassAttenuationDistance,
  };

  const sharedDieProps = {
    linearDamping,
    angularDamping,
    friction,
  };

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
          <AutoPointer {...sharedPointerProps} autoSpeed={autoSpeed} />
        )}
        {mode === 'touch/pointer' && <Pointer {...sharedPointerProps} />}
        {mode === 'hands' && (
          <HandsPointer
            {...sharedPointerProps}
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
        <D4Die bodyRef={d4Ref} scale={d4Scale} {...sharedDieProps} />
        <D6Die bodyRef={d6Ref} scale={d6Scale} {...sharedDieProps} />
        <D8Die bodyRef={d8Ref} scale={d8Scale} {...sharedDieProps} />
        <D10Die bodyRef={d10Ref} scale={d10Scale} {...sharedDieProps} />
        <D12Die bodyRef={d12Ref} scale={d12Scale} {...sharedDieProps} />
        <D20Die
          bodyRef={d20Ref}
          scale={d20Scale}
          emissiveColor={d20EmissiveColor}
          emissiveIntensity={d20EmissiveIntensity}
          {...sharedDieProps}
        />
      </Physics>
      <EffectComposer disableNormalPass multisampling={4}>
        {aoEnabled && <N8AO distanceFalloff={1} aoRadius={1} intensity={4} />}
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
              // eslint-disable-next-line react/no-array-index-key
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
