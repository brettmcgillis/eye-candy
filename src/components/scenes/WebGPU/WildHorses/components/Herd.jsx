import React, { memo, useCallback, useMemo, useRef } from 'react';

import { smokeConfig } from '@elements/SimFire/simFireControls';

import herdLayout from '../utils/herdLayout';
import HerdSmoke from './HerdSmoke';
import Horse from './Horse';
import HorseFire from './HorseFire';

function fireConfig(c) {
  return {
    blue: c.fireBlue,
    buoyancy: c.fireBuoyancy,
    cooling: c.fireCooling,
    damping: c.fireDamping,
    dissipation: c.fireDissipation,
    emitRadius: c.fireEmitRadius,
    endColor: c.fireEndColor,
    flicker: c.fireFlicker,
    forceHeight: c.fireForceHeight,
    glow: c.fireGlow,
    intensity: c.fireIntensity,
    lightColor: c.fireLightColor,
    lightDistance: c.fireLightDistance,
    lightIntensity: c.fireLightIntensity,
    mane: c.fireMane,
    maneLift: c.fireManeLift,
    midColor: c.fireMidColor,
    resolution: c.fireResolution,
    soot: c.fireSoot,
    sootDensity: c.fireSootDensity,
    startColor: c.fireStartColor,
    steps: c.fireSteps,
    tail: c.fireTail,
    temperature: c.fireTemperature,
    trail: c.fireTrail,
    turbFrequency: c.fireTurbFrequency,
    turbulence: c.fireTurbulence,
    weight: c.fireWeight,
  };
}

// The horses hold still while the field scrolls through them at
// `fieldWorldSpeed`, so that speed is the wind the fire and smoke feel.
function Herd({ config, dayNight, fieldWorldSpeed }) {
  const {
    fireDrag,
    fireEnabled,
    herdCount,
    herdSeed,
    herdSpread,
    horseCoatColor,
    horseCoatDarkness,
    horseRunSpeed,
    horseScale,
    smokeDrag,
    smokeTrailLength,
    smokeTrailLift,
    smokeVisible,
  } = config;

  const bonesRef = useRef([]);

  const members = useMemo(
    () => herdLayout({ count: herdCount, seed: herdSeed, spread: herdSpread }),
    [herdCount, herdSeed, herdSpread]
  );

  const handleBones = useCallback(
    (index) => (bones) => {
      bonesRef.current[index] = bones;
    },
    []
  );
  const bonesHandlers = useMemo(
    () => members.map((member) => handleBones(member.key)),
    [handleBones, members]
  );

  const fire = useMemo(() => fireConfig(config), [config]);
  const smoke = useMemo(() => smokeConfig(config), [config]);

  return (
    <group>
      {members.map((member, i) => (
        <Horse
          key={member.key}
          clipOffset={member.clipOffset}
          coatColor={horseCoatColor}
          coatDarkness={horseCoatDarkness}
          dayNight={dayNight}
          onBonesReady={bonesHandlers[i]}
          position={member.position}
          rotation={[0, member.rotation, 0]}
          runSpeed={horseRunSpeed}
          scale={horseScale * member.scale}
        />
      ))}
      {fireEnabled
        ? members.map((member) => (
            <HorseFire
              key={member.key}
              bonesRef={bonesRef}
              fire={fire}
              index={member.key}
              position={member.position}
              scale={horseScale * member.scale}
              windSpeed={fieldWorldSpeed * fireDrag}
            />
          ))
        : null}
      {smokeVisible ? (
        <HerdSmoke
          bonesRef={bonesRef}
          dayNight={dayNight}
          fire={fire}
          members={members}
          scale={horseScale}
          smoke={smoke}
          trailLength={smokeTrailLength}
          trailLift={smokeTrailLift}
          windSpeed={fieldWorldSpeed * smokeDrag}
        />
      ) : null}
    </group>
  );
}

export default memo(Herd);
