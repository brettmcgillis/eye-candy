import React, { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { radians, sineWave } from '../../../utils/math';
import InteractiveBret from './components/InteractiveBret';
import InteractiveReversal from './components/InteractiveReversal';

function waitAndFlip(time, waitPeriod, rotationPeriod) {
  const cycleTime = time % (waitPeriod + rotationPeriod);
  if (cycleTime < waitPeriod) {
    return 0;
  }
  const rotationTime = cycleTime - waitPeriod;
  const rotationProgress = rotationTime / rotationPeriod;
  const rotationAngle = rotationProgress * 2 * Math.PI;
  return rotationAngle;
}

export default function Logo({
  bretPosition = { x: 0, y: 0, z: 0 },
  bretRotation = { x: 0, y: 0, z: 0 },
  bretInnerColor = '#FF0000',
  bretInnerColorEmissiveIntensity = 0,
  bretOuterColor = '#000000',
  reversalPosition = { x: 0.9, y: -0.4, z: 0 },
  reversalRotation = { x: 0, y: 0, z: 0 },
  reversalInnerColor = '#FF0000',
  reversalInnerColorEmissiveIntensity = 0,
  reversalOuterColor = '#000000',
  float = true,
  floatSpeed = 1,
  floatIntensity = 0.05,
  flip = true,
  flipDelay = 4,
  flipDuration = 2,
  spin = true,
  spinRotation = 33,
  spinSpeed = 0.4,
  enableNeonFlicker = true,
  neonFlickerIntensity = 2,
  neonFlickerFrequency = 10,
  bretPressDepth = 0.012,
  reversalPressDepth = 0.015,
  growth = false,
  growthStep = 0.22,
  growthTargetEdge = 0.1,
  growthSplit = 1.35,
  growthRepulsion = 0.62,
  growthSmoothing = 1,
  growthRetention = 0.12,
  growthMaxVertices = 50000,
  growthSeed = 351107,
  growthSeedInfluence = 0.35,
  growthSpeed = 1,
  growthGradientBlur = 0.35,
  growthMode = 'breathe',
  growthReach = 40,
  growthTempo = 8,
  growthScrub = 0,
  growthPhase = 0,
  growthShadingMode = 'neon',
  growthGradientStart = '#9fd8ff',
  growthGradientEnd = '#ff0000',
  growthContrast = 1.4,
  growthBias = -0.4,
  growthFresnel = 0.05,
  growthSpecular = 0.6,
  pixelateBackdrop = false,
  pixelateCellSize = 12,
  pixelateLevels = 3,
  pixelateThreshold = 0.55,
  pixelateNoiseScale = 1.5,
  pixelateJitterAmount = 0.12,
  pixelateOutlineWidth = 0.08,
  pixelateOutlineStrength = 0.5,
  ...props
}) {
  const logoRef = useRef();
  const reversalRef = useRef();

  const logoCenterOffset = useMemo(
    () => ({
      x: (bretPosition.x + reversalPosition.x) / 2,
      y: (bretPosition.y + reversalPosition.y) / 2,
      z: (bretPosition.z + reversalPosition.z) / 2,
    }),
    [
      bretPosition.x,
      bretPosition.y,
      bretPosition.z,
      reversalPosition.x,
      reversalPosition.y,
      reversalPosition.z,
    ]
  );

  const growthSim = useMemo(
    () => ({
      growthStep,
      targetEdgeLength: growthTargetEdge,
      splitThreshold: growthSplit,
      repulsion: growthRepulsion,
      smoothing: growthSmoothing,
      shapeRetention: growthRetention,
      maxVertices: growthMaxVertices,
      seed: growthSeed,
      seedInfluence: growthSeedInfluence,
      growthSpeed,
      gradientBlur: growthGradientBlur,
    }),
    [
      growthStep,
      growthTargetEdge,
      growthSplit,
      growthRepulsion,
      growthSmoothing,
      growthRetention,
      growthMaxVertices,
      growthSeed,
      growthSeedInfluence,
      growthSpeed,
      growthGradientBlur,
    ]
  );

  const growthDriver = useMemo(
    () => ({
      mode: growthMode,
      reach: growthReach,
      tempo: growthTempo,
      scrub: growthScrub,
      phase: growthPhase,
    }),
    [growthMode, growthReach, growthTempo, growthScrub, growthPhase]
  );

  const growthShading = useMemo(
    () => ({
      mode: growthShadingMode,
      gradientType:
        growthShadingMode === 'displacement' ? 'displacement' : 'curvature',
      gradientStart: growthGradientStart,
      gradientEnd: growthGradientEnd,
      curvatureContrast: growthContrast,
      curvatureBias: growthBias,
      fresnel: growthFresnel,
      specular: growthSpecular,
    }),
    [
      growthShadingMode,
      growthGradientStart,
      growthGradientEnd,
      growthContrast,
      growthBias,
      growthFresnel,
      growthSpecular,
    ]
  );

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (!logoRef.current || !reversalRef.current) {
      return;
    }

    if (float) {
      logoRef.current.position.y = sineWave(time, floatSpeed, floatIntensity);
    } else if (logoRef.current.position.y !== 0) {
      logoRef.current.position.y = sineWave(
        time,
        floatSpeed * 2,
        floatIntensity
      );
      if (Math.abs(logoRef.current.position.y) < 0.01) {
        logoRef.current.position.y = 0;
      }
    }
    if (spin) {
      logoRef.current.rotation.y = radians(
        sineWave(time, spinSpeed, spinRotation)
      );
    } else if (logoRef.current.rotation.y !== 0) {
      logoRef.current.rotation.y = radians(
        sineWave(time, spinSpeed * 2, spinRotation)
      );
      if (Math.abs(logoRef.current.rotation.y) < 0.1) {
        logoRef.current.rotation.y = 0;
      }
    }
    if (flip || reversalRef.current.rotation.x !== 0) {
      reversalRef.current.rotation.x = waitAndFlip(
        time,
        flipDelay,
        flipDuration
      );
    }
  });

  return (
    <group {...props} dispose={null}>
      <group ref={logoRef}>
        <group
          position={[
            bretPosition.x - logoCenterOffset.x,
            bretPosition.y - logoCenterOffset.y,
            bretPosition.z - logoCenterOffset.z,
          ]}
          rotation={[
            radians(bretRotation.x),
            radians(bretRotation.y),
            radians(bretRotation.z),
          ]}
        >
          <InteractiveBret
            pressDepth={bretPressDepth}
            emissiveIntensity={bretInnerColorEmissiveIntensity}
            enableNeonFlicker={enableNeonFlicker}
            neonFlickerIntensity={neonFlickerIntensity}
            neonFlickerFrequency={neonFlickerFrequency}
            innerColor={bretInnerColor}
            outerColor={bretOuterColor}
            growthEnabled={growth}
            growthSim={growthSim}
            growthDriver={growthDriver}
            growthShading={growthShading}
            phaseOffset={0}
            pixelateBackdrop={pixelateBackdrop}
            pixelateCellSize={pixelateCellSize}
            pixelateLevels={pixelateLevels}
            pixelateThreshold={pixelateThreshold}
            pixelateNoiseScale={pixelateNoiseScale}
            pixelateJitterAmount={pixelateJitterAmount}
            pixelateOutlineWidth={pixelateOutlineWidth}
            pixelateOutlineStrength={pixelateOutlineStrength}
          />
        </group>
        <group
          position={[
            reversalPosition.x - logoCenterOffset.x,
            reversalPosition.y - logoCenterOffset.y,
            reversalPosition.z - logoCenterOffset.z,
          ]}
          rotation={[
            radians(reversalRotation.x),
            radians(reversalRotation.y),
            radians(reversalRotation.z),
          ]}
        >
          <group ref={reversalRef}>
            <InteractiveReversal
              pressDepth={reversalPressDepth}
              emissiveIntensity={reversalInnerColorEmissiveIntensity}
              enableNeonFlicker={enableNeonFlicker}
              neonFlickerIntensity={neonFlickerIntensity}
              neonFlickerFrequency={neonFlickerFrequency}
              innerColor={reversalInnerColor}
              outerColor={reversalOuterColor}
              growthEnabled={growth}
              growthSim={growthSim}
              growthDriver={growthDriver}
              growthShading={growthShading}
              phaseOffset={0.5}
              pixelateBackdrop={pixelateBackdrop}
              pixelateCellSize={pixelateCellSize}
              pixelateLevels={pixelateLevels}
              pixelateThreshold={pixelateThreshold}
              pixelateNoiseScale={pixelateNoiseScale}
              pixelateJitterAmount={pixelateJitterAmount}
              pixelateOutlineWidth={pixelateOutlineWidth}
              pixelateOutlineStrength={pixelateOutlineStrength}
            />
          </group>
        </group>
      </group>
    </group>
  );
}
