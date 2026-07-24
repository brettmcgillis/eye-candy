import React from 'react';

import { BakeShadows } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import { CameraRig } from '../../../../../modules/cameraRig';
import BugSparkles from '../../../../elements/BugSparkles';
import Logo from '../../../../elements/logo/Logo';
import PostEffects from './components/PostEffects';
import useSceneControls from './hooks/useSceneControls';

export default function LoGlow() {
  const { size } = useThree();
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
    bloomEnabled,
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
    sparklesEnabled,
    sparkleColor,
    sparkleCount,
    sparkleOpactity,
    sparkleScale,
    sparkleSize,
    sparkleSpeed,
    fractalPixelateEnabled,
    fractalPixelateApplyToLogo,
    fractalPixelateCellSize,
    fractalPixelateLevels,
    fractalPixelateThreshold,
    fractalPixelateNoiseScale,
    fractalPixelateJitterAmount,
    fractalPixelateOutlineWidth,
    fractalPixelateOutlineStrength,
    enableNeonFlicker,
    neonFlickerIntensity,
    neonFlickerFrequency,
    growth,
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
    growthMode,
    growthReach,
    growthTempo,
    growthScrub,
    growthPhase,
    growthShadingMode,
    growthGradientStart,
    growthGradientEnd,
    growthContrast,
    growthBias,
    growthFresnel,
    growthSpecular,
    camera,
  } = useSceneControls();

  return (
    <>
      <ambientLight color={ambientColor} intensity={ambientIntensity} />
      <directionalLight
        color={keyColor}
        intensity={keyIntensity}
        position={[keyPosition.x, keyPosition.y, keyPosition.z]}
      />
      <CameraRig camera={camera} />
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
          growth,
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
          growthMode,
          growthReach,
          growthTempo,
          growthScrub,
          growthPhase,
          growthShadingMode,
          growthGradientStart,
          growthGradientEnd,
          growthContrast,
          growthBias,
          growthFresnel,
          growthSpecular,
          pixelateBackdrop: fractalPixelateApplyToLogo,
          pixelateCellSize: fractalPixelateCellSize,
          pixelateLevels: fractalPixelateLevels,
          pixelateThreshold: fractalPixelateThreshold,
          pixelateNoiseScale: fractalPixelateNoiseScale,
          pixelateJitterAmount: fractalPixelateJitterAmount,
          pixelateOutlineWidth: fractalPixelateOutlineWidth,
          pixelateOutlineStrength: fractalPixelateOutlineStrength,
        }}
      />

      {sparklesEnabled && (
        <BugSparkles
          count={sparkleCount}
          speed={sparkleSpeed}
          opacity={sparkleOpactity}
          color={sparkleColor}
          size={sparkleSize}
          scale={sparkleScale}
        />
      )}
      <PostEffects
        bloomEnabled={bloomEnabled}
        bloomThreshold={bloomThreshold}
        bloomStrength={bloomStrength}
        bloomRadius={bloomRadius}
        fractalPixelateEnabled={fractalPixelateEnabled}
        fractalPixelateCellSize={fractalPixelateCellSize}
        fractalPixelateLevels={fractalPixelateLevels}
        fractalPixelateThreshold={fractalPixelateThreshold}
        fractalPixelateNoiseScale={fractalPixelateNoiseScale}
        fractalPixelateJitterAmount={fractalPixelateJitterAmount}
        fractalPixelateOutlineWidth={fractalPixelateOutlineWidth}
        fractalPixelateOutlineStrength={fractalPixelateOutlineStrength}
      />
    </>
  );
}
