import React, { memo } from 'react';

import SmokeParticles from '@elements/smoke/SmokeParticles';
import { getSplineWorldOrigin } from '@elements/splineGroup/splineDefaults';
import VolumetricFire from '@elements/volumetricFire/VolumetricFire';

function EngineFire({
  leftEngineMainFire,
  rightEngineMainFire,
  leftWingSecondaryFire,
  rightWingSecondaryFire,
  leftEngineSmokeTrail,
  rightEngineSmokeTrail,
  leftSmokePoints,
  rightSmokePoints,
}) {
  return (
    <>
      {/* Warm point lights at engines — give fire a glow spread */}
      <pointLight
        position={
          leftEngineMainFire
            ? getSplineWorldOrigin(leftEngineMainFire).toArray()
            : [-1.8, -0.1, 0.4]
        }
        color="#ff6600"
        intensity={4}
        distance={8}
        decay={2}
      />
      <pointLight
        position={
          rightEngineMainFire
            ? getSplineWorldOrigin(rightEngineMainFire).toArray()
            : [1.8, -0.1, 0.4]
        }
        color="#ff6600"
        intensity={4}
        distance={8}
        decay={2}
      />

      {/* Volumetric fire at left engine — flame bends backward in airstream */}
      <VolumetricFire
        position={
          leftEngineMainFire
            ? getSplineWorldOrigin(leftEngineMainFire).toArray()
            : [-1.8, 0.0, 0.3]
        }
        width={leftEngineMainFire?.fireWidth ?? 0.5}
        height={leftEngineMainFire?.fireHeight ?? 1.8}
        depth={leftEngineMainFire?.fireDepth ?? 0.5}
        sliceSpacing={leftEngineMainFire?.fireSliceSpacing ?? 0.08}
        magnitude={leftEngineMainFire?.fireMagnitude ?? 1.6}
        brightness={leftEngineMainFire?.fireBrightness ?? 2.2}
        saturation={leftEngineMainFire?.fireSaturation ?? 0.9}
        animated={leftEngineMainFire?.fireAnimated ?? true}
        bendX={0.4}
        bendZ={-1.2}
        animSpeed={leftEngineMainFire?.fireAnimSpeed ?? 0.85}
        tintColor={leftEngineMainFire?.fireTintColor ?? '#ffcc44'}
      />

      {/* Volumetric fire at right engine */}
      <VolumetricFire
        position={
          rightEngineMainFire
            ? getSplineWorldOrigin(rightEngineMainFire).toArray()
            : [1.8, 0.0, 0.3]
        }
        width={rightEngineMainFire?.fireWidth ?? 0.5}
        height={rightEngineMainFire?.fireHeight ?? 1.8}
        depth={rightEngineMainFire?.fireDepth ?? 0.5}
        sliceSpacing={rightEngineMainFire?.fireSliceSpacing ?? 0.08}
        magnitude={rightEngineMainFire?.fireMagnitude ?? 1.6}
        brightness={rightEngineMainFire?.fireBrightness ?? 2.2}
        saturation={rightEngineMainFire?.fireSaturation ?? 0.9}
        animated={rightEngineMainFire?.fireAnimated ?? true}
        bendX={-0.4}
        bendZ={-1.2}
        animSpeed={rightEngineMainFire?.fireAnimSpeed ?? 0.75}
        tintColor={rightEngineMainFire?.fireTintColor ?? '#ffcc44'}
      />

      {/* Secondary smaller flames — wing wrapping effect */}
      <VolumetricFire
        position={
          leftWingSecondaryFire
            ? getSplineWorldOrigin(leftWingSecondaryFire).toArray()
            : [-1.4, 0.3, -0.2]
        }
        width={leftWingSecondaryFire?.fireWidth ?? 0.35}
        height={leftWingSecondaryFire?.fireHeight ?? 1.2}
        depth={leftWingSecondaryFire?.fireDepth ?? 0.35}
        sliceSpacing={leftWingSecondaryFire?.fireSliceSpacing ?? 0.1}
        segments={16}
        magnitude={leftWingSecondaryFire?.fireMagnitude ?? 1.4}
        brightness={leftWingSecondaryFire?.fireBrightness ?? 1.8}
        animated={leftWingSecondaryFire?.fireAnimated ?? true}
        animSpeed={leftWingSecondaryFire?.fireAnimSpeed ?? 1.1}
        bendX={0.2}
        bendZ={-0.9}
        tintColor={leftWingSecondaryFire?.fireTintColor ?? '#ff8833'}
      />
      <VolumetricFire
        position={
          rightWingSecondaryFire
            ? getSplineWorldOrigin(rightWingSecondaryFire).toArray()
            : [1.4, 0.3, -0.2]
        }
        width={rightWingSecondaryFire?.fireWidth ?? 0.35}
        height={rightWingSecondaryFire?.fireHeight ?? 1.2}
        depth={rightWingSecondaryFire?.fireDepth ?? 0.35}
        sliceSpacing={rightWingSecondaryFire?.fireSliceSpacing ?? 0.1}
        segments={16}
        magnitude={rightWingSecondaryFire?.fireMagnitude ?? 1.4}
        brightness={rightWingSecondaryFire?.fireBrightness ?? 1.8}
        animated={rightWingSecondaryFire?.fireAnimated ?? true}
        animSpeed={rightWingSecondaryFire?.fireAnimSpeed ?? 1.0}
        bendX={-0.2}
        bendZ={-0.9}
        tintColor={rightWingSecondaryFire?.fireTintColor ?? '#ff8833'}
      />

      {/* Smoke trailing from engines */}
      <SmokeParticles points={leftSmokePoints} config={leftEngineSmokeTrail} />
      <SmokeParticles
        points={rightSmokePoints}
        config={rightEngineSmokeTrail}
      />
    </>
  );
}

export default memo(EngineFire);
