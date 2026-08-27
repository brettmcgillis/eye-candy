import React, { memo, useCallback, useMemo } from 'react';

import herdLayout from '../utils/herdLayout';
import Horse from './Horse';

function Herd({ config, dayNight, onBonesReady }) {
  const {
    herdCount,
    herdSeed,
    herdSpread,
    horseCoatColor,
    horseCoatDarkness,
    horseRunSpeed,
    horseScale,
  } = config;

  const members = useMemo(
    () => herdLayout({ count: herdCount, seed: herdSeed, spread: herdSpread }),
    [herdCount, herdSeed, herdSpread]
  );

  const handleBones = useCallback(
    (index) => (bones) => onBonesReady?.(index, bones),
    [onBonesReady]
  );

  return (
    <group>
      {members.map((member) => (
        <Horse
          key={member.key}
          clipOffset={member.clipOffset}
          coatColor={horseCoatColor}
          coatDarkness={horseCoatDarkness}
          dayNight={dayNight}
          onBonesReady={handleBones(member.key)}
          position={member.position}
          rotation={[0, member.rotation, 0]}
          runSpeed={horseRunSpeed}
          scale={horseScale * member.scale}
        />
      ))}
    </group>
  );
}

export default memo(Herd);
