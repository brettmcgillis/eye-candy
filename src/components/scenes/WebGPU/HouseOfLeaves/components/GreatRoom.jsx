import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { createShaftMouthRoom, createThreshold } from '@modules/houseOfLeaves';

// Enormous, and defined by what the lamp fails to reach. The source puts the
// ceiling past five hundred feet and the span near a mile, so the walls and
// roof are never seen — but they have to exist, or the fog has nothing to
// bound and the room reads as an open field rather than an interior.
//
// Static: it is one room, not a streamed run, so it is built once and only
// moved by the walker's rebase.
function GreatRoom({ config, material, walker }) {
  const groupRef = useRef(null);

  const parts = useMemo(() => {
    const opening = {
      openingWidth: config.corridorWidth,
      openingHeight: config.corridorHeight,
      archRise: config.corridorHeight * config.archRatio,
    };
    return {
      room: createShaftMouthRoom({
        width: config.roomSize,
        depth: config.roomSize,
        height: config.roomHeight,
        holeRadius: config.holeRadius,
        doorwaySide: -1,
        doorway: { width: config.corridorWidth },
      }),
      // The wall the corridor arrives through, carrying the same arch every
      // other threshold in the labyrinth uses.
      doorWall: createThreshold({
        wallWidth: config.roomSize,
        wallHeight: config.roomHeight,
        thickness: config.bulkheadThickness,
        ...opening,
      }),
    };
  }, [
    config.archRatio,
    config.bulkheadThickness,
    config.corridorHeight,
    config.corridorWidth,
    config.holeRadius,
    config.roomHeight,
    config.roomSize,
  ]);

  useEffect(
    () => () => Object.values(parts).forEach((part) => part.dispose()),
    [parts]
  );

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const { anchor } = walker;
    group.position.set(
      config.origin.x - anchor.x,
      -anchor.y,
      config.origin.z - anchor.z
    );
  });

  return (
    <group ref={groupRef}>
      <mesh
        castShadow
        geometry={parts.room}
        material={material}
        receiveShadow
      />
      <mesh
        castShadow
        geometry={parts.doorWall}
        material={material}
        position={[-config.roomSize * 0.5 - config.bulkheadThickness, 0, 0]}
        receiveShadow
      />
    </group>
  );
}

export default memo(GreatRoom);
