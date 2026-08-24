import React, { useEffect, useRef } from 'react';

import { MeshTransmissionMaterial } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { BallCollider, RigidBody } from '@react-three/rapier';

import * as THREE from 'three';

import { useHandGestureEvents } from '@modules/handTracking';
import { useHandControls } from '@modules/handTracking';
import { useMediaPipeHands } from '@modules/handTracking';

import { ROLL_DIE_EVENT } from '../presets/QuinnsDice.sceneSettings';

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

export const Pointer = React.memo(function Pointer({
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
    const targetZ = THREE.MathUtils.clamp(
      0,
      -boxDepth / 2 + margin,
      boxDepth / 2 - margin
    );
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

export const AutoPointer = React.memo(function AutoPointer({
  radius = 1,
  autoSpeed = 0.6,
  followSpeed = 30,
  boxWidth = 10,
  boxHeight = 10,
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

export const HandsPointer = React.memo(function HandsPointer({
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
