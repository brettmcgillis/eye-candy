import React, { useRef } from 'react';

import { useFrame } from '@react-three/fiber';

// The scene's fire-light rig as authored; a rig passed in overrides it key
// by key.
export const DEFAULT_FIRE_LIGHT_RIG = Object.freeze({
  enabled: true,
  color: '#ff7a1f',
  intensity: 12,
  intensityJitter: 3.75,
  secondaryJitter: 1.25,
  distance: 1.5,
  decay: 1.4,
  flickerSpeed: 7,
  swayX: 0.08,
  swayY: 0.05,
  swayZ: 0.08,
  leftX: 0.15,
  leftY: 0.75,
  leftZ: 0,
  rightX: 1.15,
  rightY: 0.45,
  rightZ: 0,
});

// The two flickering point lights a burning FireAndSmoke instance throws,
// each swaying and pulsing on its own phase.
export default function FireLights({ rig }) {
  const leftLightRef = useRef(null);
  const rightLightRef = useRef(null);
  const phaseOffsetsRef = useRef([
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2 + Math.PI * 0.45,
  ]);
  const config = {
    ...DEFAULT_FIRE_LIGHT_RIG,
    ...rig,
  };

  useFrame(({ clock }) => {
    const lights = [
      {
        ref: leftLightRef,
        basePosition: [config.leftX, config.leftY, config.leftZ],
        phaseOffset: phaseOffsetsRef.current[0],
        speedScale: 1,
      },
      {
        ref: rightLightRef,
        basePosition: [config.rightX, config.rightY, config.rightZ],
        phaseOffset: phaseOffsetsRef.current[1],
        speedScale: 1.11,
      },
    ];

    lights.forEach(({ ref, basePosition, phaseOffset, speedScale }) => {
      const light = ref.current;

      if (!light) {
        return;
      }

      const t = clock.elapsedTime * config.flickerSpeed * speedScale;
      const primary = t + phaseOffset;
      const secondary = t * 1.87 + phaseOffset * 0.7;

      light.position.x = basePosition[0] + Math.sin(primary) * config.swayX;
      light.position.y = basePosition[1] + Math.sin(secondary) * config.swayY;
      light.position.z =
        basePosition[2] + Math.cos(primary * 0.82) * config.swayZ;
      light.intensity = Math.max(
        0,
        config.intensity +
          Math.sin(primary * 1.13) * config.intensityJitter +
          Math.cos(secondary * 0.93) * config.secondaryJitter
      );
    });
  });

  return (
    <>
      <pointLight
        ref={leftLightRef}
        color={config.color}
        intensity={config.intensity}
        distance={config.distance}
        decay={config.decay}
        position={[config.leftX, config.leftY, config.leftZ]}
      />
      <pointLight
        ref={rightLightRef}
        color={config.color}
        intensity={config.intensity}
        distance={config.distance}
        decay={config.decay}
        position={[config.rightX, config.rightY, config.rightZ]}
      />
    </>
  );
}
