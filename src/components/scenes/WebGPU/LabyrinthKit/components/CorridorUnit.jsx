import React, { memo, useEffect, useMemo } from 'react';

import {
  Flare,
  createHallway,
  createRoom,
  createThreshold,
  hallwaySideDoor,
} from '@modules/houseOfLeaves';

// One corridor segment, plus whatever leaves it: a doorway, a room, a branch
// that carries on, or a branch that stops a few metres in. Dead ends are only
// ever placed to the side — the way ahead is never closed.
function CorridorUnit({ config, material, segment, variation }) {
  const along = segment.length * 0.5;
  const side = variation.side ?? 1;
  const midWidth = (segment.widthStart + segment.widthEnd) * 0.5;
  const midHeight = (segment.heightStart + segment.heightEnd) * 0.5;

  const door = useMemo(
    () =>
      hallwaySideDoor({
        width: midWidth * config.branchWidthScale,
        height: midHeight * config.branchWidthScale,
        archRise: midWidth * config.branchWidthScale * 0.5,
      }),
    [config.branchWidthScale, midHeight, midWidth]
  );

  const hasOpening = variation.kind !== 'plain';

  const corridor = useMemo(
    () =>
      createHallway({
        length: segment.length,
        width: segment.widthStart,
        height: segment.heightStart,
        widthEnd: segment.widthEnd,
        heightEnd: segment.heightEnd,
        archRise: segment.heightStart * config.archRatio,
        lengthSegments: config.corridorSegments,
        revealDepth: config.revealDepth,
        sideOpenings: hasOpening
          ? [
              {
                side,
                at: along,
                width: door.width,
                height: door.height,
                archRise: door.archRise,
              },
            ]
          : [],
      }),
    [
      along,
      config.archRatio,
      config.corridorSegments,
      door,
      hasOpening,
      segment,
      side,
    ]
  );

  // A jump in section is covered by a bulkhead: a wall spanning the larger
  // opening with a hole the size of the smaller, so a stepped change reads as
  // architecture rather than as a hole in the world.
  const bulkhead = useMemo(() => {
    if (!segment.jump) return null;
    const wallWidth = Math.max(segment.widthEnd, segment.nextWidth) * 1.02;
    const wallHeight = Math.max(segment.heightEnd, segment.nextHeight) * 1.02;
    const openingWidth = Math.min(segment.widthEnd, segment.nextWidth);
    const openingHeight = Math.min(segment.heightEnd, segment.nextHeight);
    return createThreshold({
      wallWidth,
      wallHeight,
      thickness: config.bulkheadThickness,
      openingWidth,
      openingHeight,
      archRise: openingHeight * config.archRatio,
    });
  }, [config.archRatio, config.bulkheadThickness, segment]);

  const branch = useMemo(() => {
    if (variation.kind !== 'junction' && variation.kind !== 'deadEnd')
      return null;
    const length =
      variation.kind === 'deadEnd' ? config.deadEndLength : config.branchLength;
    return createHallway({
      length,
      width: door.width,
      height: door.height,
      archRise: door.archRise,
      capEnd: variation.kind === 'deadEnd',
      lengthSegments: 8,
      revealDepth: 0,
    });
  }, [config.branchLength, config.deadEndLength, door, variation.kind]);

  const room = useMemo(() => {
    if (variation.kind !== 'room') return null;
    return createRoom({
      depth: config.branchRoomDepth,
      width: config.branchRoomWidth,
      height: Math.max(door.height + 1, config.branchRoomHeight),
      doorWidth: door.width,
      doorHeight: door.height,
      doorArchRise: door.archRise,
    });
  }, [
    config.branchRoomDepth,
    config.branchRoomHeight,
    config.branchRoomWidth,
    door,
    variation.kind,
  ]);

  useEffect(
    () => () => {
      corridor.dispose();
      bulkhead?.dispose();
      branch?.dispose();
      room?.dispose();
    },
    [bulkhead, branch, corridor, room]
  );

  const sideOffset = midWidth * 0.5;
  const sideRotation = side === 1 ? -Math.PI / 2 : Math.PI / 2;

  return (
    <>
      <mesh castShadow receiveShadow geometry={corridor} material={material} />
      {bulkhead && (
        <mesh
          castShadow
          receiveShadow
          geometry={bulkhead}
          material={material}
          position={[segment.length, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
        />
      )}
      {branch && (
        <mesh
          castShadow
          receiveShadow
          geometry={branch}
          material={material}
          position={[along, 0, side * sideOffset]}
          rotation={[0, sideRotation, 0]}
        />
      )}
      {room && (
        <mesh
          castShadow
          receiveShadow
          geometry={room}
          material={material}
          position={[along, 0, side * sideOffset]}
          rotation={[0, sideRotation, 0]}
        />
      )}
      {variation.kind === 'deadEnd' && config.deadEndFlare && (
        <Flare
          color={config.flareColor}
          glow={config.flareGlow}
          intensity={config.flareIntensity}
          length={config.flareLength}
          position={[
            along,
            0,
            side * (sideOffset + config.deadEndLength * 0.7),
          ]}
          radius={config.flareRadius}
          range={config.flareRange}
          seed={segment.index}
          shadows={false}
        />
      )}
    </>
  );
}

export default memo(CorridorUnit);
