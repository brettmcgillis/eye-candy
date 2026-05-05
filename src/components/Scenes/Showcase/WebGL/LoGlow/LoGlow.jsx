import { UnrealBloomPass } from 'three-stdlib';

import React from 'react';

import {
  BakeShadows,
  Effects,
  PerspectiveCamera,
  Sparkles,
} from '@react-three/drei';
import { extend, useThree } from '@react-three/fiber';

import Logo from '../../../../elements/logo/Logo';
import useSceneControls from './hooks/useSceneControls';

extend({ UnrealBloomPass });

export default function LoGlow() {
  const { size } = useThree();
  const cameraZ = size.width <= 768 ? 6.5 : 5;
  const logoY = size.width <= 768 ? 0 : -0.2;

  const {
    backgroundColor,
    fogColor,
    fogNear,
    fogFar,
    ambientColor,
    ambientIntensity,
    keyColor,
    keyIntensity,
    keyPosition,
    bloomThreshold,
    bloomStrength,
    bloomRadius,
    bretPosition,
    bretRotation,
    bretInnerColor,
    bretInnerColorEmissive,
    bretInnerColorEmissiveIntensity,
    bretOuterColor,
    bretOuterColorEmissive,
    bretOuterColorEmissiveIntensity,
    reversalPosition,
    reversalRotation,
    reversalInnerColor,
    reversalInnerColorEmissive,
    reversalInnerColorEmissiveIntensity,
    reversalOuterColor,
    reversalOuterColorEmissive,
    reversalOuterColorEmissiveIntensity,
    bretPressDepth,
    reversalPressDepth,
    flip,
    flipDelay,
    flipDuration,
    float,
    floatSpeed,
    floatIntensity,
    spin,
    spinRotation,
    spinSpeed,
    sparkleColor,
    sparkleCount,
    sparkleNoise,
    sparkleOpactity,
    sparkleScale,
    sparkleSize,
    sparkleSpeed,
    enableNeonFlicker,
    neonFlickerIntensity,
    neonFlickerFrequency,
  } = useSceneControls();

  return (
    <>
      <ambientLight color={ambientColor} intensity={ambientIntensity} />
      <directionalLight
        color={keyColor}
        intensity={keyIntensity}
        position={[keyPosition.x, keyPosition.y, keyPosition.z]}
      />
      <PerspectiveCamera makeDefault position={[0, 0, cameraZ]} />
      <BakeShadows />

      <color attach="background" args={[backgroundColor]} />
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />

      <Logo
        scale={2}
        position={[0, logoY, 0]}
        {...{
          bretPosition,
          bretRotation,
          bretInnerColor,
          bretInnerColorEmissive,
          bretInnerColorEmissiveIntensity,
          bretOuterColor,
          bretOuterColorEmissive,
          bretOuterColorEmissiveIntensity,
          reversalPosition,
          reversalRotation,
          reversalInnerColor,
          reversalInnerColorEmissive,
          reversalInnerColorEmissiveIntensity,
          reversalOuterColor,
          reversalOuterColorEmissive,
          reversalOuterColorEmissiveIntensity,
          enableNeonFlicker,
          neonFlickerIntensity,
          neonFlickerFrequency,
          bretPressDepth,
          reversalPressDepth,
          flip,
          flipDelay,
          flipDuration,
          float,
          floatSpeed,
          floatIntensity,
          spin,
          spinRotation,
          spinSpeed,
        }}
      />

      <Sparkles
        count={sparkleCount}
        speed={sparkleSpeed}
        opacity={sparkleOpactity}
        color={sparkleColor}
        size={sparkleSize}
        scale={sparkleScale}
        noise={sparkleNoise}
      />
      <Effects disableGamma>
        <unrealBloomPass
          threshold={bloomThreshold}
          strength={bloomStrength}
          radius={bloomRadius}
        />
      </Effects>
    </>
  );
}
