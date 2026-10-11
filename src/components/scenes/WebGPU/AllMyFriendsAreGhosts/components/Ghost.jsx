import React, { memo, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import GhostCharacter from '@elements/WebGPU/ghost/GhostCharacter';
import { SPHERE_BASE_Y } from '@elements/WebGPU/ghost/ghostRig';

import GHOST_SKIN from '../utils/ghostSkin';

const DEG2RAD = Math.PI / 180;

function gustNoise(t) {
  return (
    0.5 * Math.sin(t * 1.3 + 0.4) +
    0.3 * Math.sin(t * 3.7 + 2.1) +
    0.2 * Math.sin(t * 9.1 + 4.6)
  );
}

function Ghost({ anchorRef, config }) {
  const anchorGroupRef = useRef(null);
  const inputRef = useRef({
    animation: null,
    expressionKey: 0,
    jumpTriggered: false,
    windDirX: 0,
    windDirZ: 0,
    windStrength: 0,
  });
  const timeRef = useRef(0);

  const {
    ghostPosition,
    ghostRotationY,
    ghostScale,
    ghostTiltBack,
    ghostWindAngle,
    ghostWindGust,
    ghostWindStrength,
  } = config;

  const position = useMemo(
    () => [ghostPosition.x, ghostPosition.y, ghostPosition.z],
    [ghostPosition.x, ghostPosition.y, ghostPosition.z]
  );

  useFrame((_, delta) => {
    timeRef.current += delta;
    const anchorGroup = anchorGroupRef.current;
    const anchor = anchorRef.current;
    if (anchorGroup && anchor) {
      anchorGroup.position.copy(anchor.position);
      anchorGroup.quaternion.copy(anchor.quaternion);
    }

    const heading = ghostWindAngle * DEG2RAD;
    const facing = ghostRotationY * DEG2RAD;
    const worldX = Math.sin(heading);
    const worldZ = Math.cos(heading);
    const cosF = Math.cos(facing);
    const sinF = Math.sin(facing);
    const gust = 1 + ghostWindGust * gustNoise(timeRef.current);
    const input = inputRef.current;
    input.windDirX = worldX * cosF - worldZ * sinF;
    input.windDirZ = worldX * sinF + worldZ * cosF;
    input.windStrength = Math.max(0, ghostWindStrength * gust);
  });

  return (
    <group ref={anchorGroupRef}>
      <group
        position={position}
        rotation-y={ghostRotationY * DEG2RAD}
        scale={ghostScale}
      >
        <group position-y={SPHERE_BASE_Y} rotation-x={-ghostTiltBack * DEG2RAD}>
          <group position-y={-SPHERE_BASE_Y}>
            <GhostCharacter
              {...GHOST_SKIN}
              animationInputRef={inputRef}
              baseWind={config.ghostBaseWind}
              bobAmplitude={config.ghostBobAmplitude}
              bobSpeed={config.ghostBobSpeed}
              color={config.ghostColor}
              eyeColor={config.ghostEyeColor}
              eyeIntensity={config.ghostEyeIntensity}
              groundLightColor={config.ghostGlowColor}
              groundLightIntensity={config.ghostGroundLightIntensity}
              innerEmissiveColor={config.ghostGlowColor}
              innerEmissiveIntensity={config.ghostInnerGlow}
              outerEmissiveColor={config.ghostGlowColor}
              outerEmissiveIntensity={config.ghostOuterGlow}
              segmentsX={config.ghostClothSegments}
              segmentsY={config.ghostClothSegments}
              tiltIntensity={config.ghostTilt}
              windBoostMul={config.ghostWindBoost}
            />
          </group>
        </group>
      </group>
    </group>
  );
}

export default memo(Ghost);
