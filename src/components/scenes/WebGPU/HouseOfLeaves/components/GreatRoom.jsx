import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { createGreatRoom, segmentAt } from '@modules/houseOfLeaves';

import { COLUMNS } from '../utils/shaftGrid';

// Enormous, and defined by what the lamp fails to reach. The walls and roof
// are never seen — but they have to exist, or the fog has nothing to bound
// and the room reads as an open field rather than an interior.
function GreatRoom({ config, material, walker, world, zone }) {
  const groupRef = useRef(null);

  const geometry = useMemo(() => {
    // The corridor's last unit ends in this wall; the doorway is its section.
    const corridor = world.get(`corridor#${zone.lap}`);
    const last = corridor
      ? segmentAt(
          Math.round(corridor.length / config.segmentLength) - 1,
          corridor.profile
        )
      : null;
    return createGreatRoom({
      width: config.roomSize,
      depth: config.roomSize,
      height: config.roomHeight,
      hole: { ...zone.hole, segments: COLUMNS },
      doorway: {
        width: last?.widthEnd ?? config.corridorWidth,
        height: last?.heightEnd ?? config.corridorHeight,
        z: 0,
      },
    });
  }, [config, world, zone]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const { anchor } = walker;
    const { frame } = zone;
    group.position.set(
      frame.x - anchor.x,
      frame.y - anchor.y,
      frame.z - anchor.z
    );
    group.rotation.y = frame.rotationY;
  });

  return (
    <group ref={groupRef}>
      <mesh castShadow geometry={geometry} material={material} receiveShadow />
    </group>
  );
}

export default memo(GreatRoom);
