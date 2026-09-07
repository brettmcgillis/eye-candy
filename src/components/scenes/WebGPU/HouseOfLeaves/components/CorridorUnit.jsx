import React, { memo, useEffect, useMemo } from 'react';

import {
  createHallway,
  createRoom,
  createThreshold,
  hallwaySideDoor,
} from '@modules/houseOfLeaves';

import Flare from './Flare';

// One corridor segment and whatever leaves it: a doorway, a room, a branch
// that carries on, or a branch that stops a few metres in. Dead ends are only
// ever placed to the side — the way ahead is never closed.
//
// Mounted per absolute index rather than pooled. Segments arrive one every
// sixteen seconds at a walk, so React handling the churn is cheaper than a
// pool would be, and each unit's pieces differ too much to share slots.
function CorridorUnit({
  config,
  flares,
  hasFlare,
  material,
  segment,
  variation,
}) {
  const along = segment.length * 0.5;
  const side = variation.side ?? 1;
  const midWidth = (segment.widthStart + segment.widthEnd) * 0.5;
  const midHeight = (segment.heightStart + segment.heightEnd) * 0.5;
  const hasOpening = variation.kind !== 'plain';

  const door = useMemo(
    () =>
      hallwaySideDoor({
        width: midWidth * config.branchWidthScale,
        height: midHeight * config.branchWidthScale,
        archRise: midWidth * config.branchWidthScale * 0.5,
      }),
    [config.branchWidthScale, midHeight, midWidth]
  );

  const parts = useMemo(() => {
    const made = {};
    made.corridor = createHallway({
      length: segment.length,
      width: segment.widthStart,
      height: segment.heightStart,
      widthEnd: segment.widthEnd,
      heightEnd: segment.heightEnd,
      archRise: segment.heightStart * config.archRatio,
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
    });

    // A jump in section is covered by a bulkhead: a wall spanning the larger
    // opening with a hole the size of the smaller, so a stepped change reads
    // as architecture rather than as a hole in the world.
    //
    // `createThreshold` already spans Z with its thickness along X, which is
    // across a corridor swept along X — it needs no rotation. Turning it a
    // quarter turn laid it *along* the hallway instead, which left every
    // stepped joint uncovered and showed daylight out of the world.
    if (segment.jump) {
      // Strictly inside both sections rather than exactly the smaller one. The
      // two corridors' arches are struck at slightly different rises, so an
      // opening sized to the smaller can still poke through its springline;
      // the shortfall reads as a reveal, which a bulkhead should have anyway.
      const openingWidth = Math.min(segment.widthEnd, segment.nextWidth) * 0.97;
      const openingHeight =
        Math.min(segment.heightEnd, segment.nextHeight) * 0.97;
      made.bulkhead = createThreshold({
        wallWidth: Math.max(segment.widthEnd, segment.nextWidth) * 1.04,
        wallHeight: Math.max(segment.heightEnd, segment.nextHeight) * 1.04,
        thickness: config.bulkheadThickness,
        openingWidth,
        openingHeight,
        archRise: openingHeight * config.archRatio,
      });
    }

    if (variation.kind === 'junction' || variation.kind === 'deadEnd') {
      made.branch = createHallway({
        length:
          variation.kind === 'deadEnd'
            ? config.deadEndLength
            : config.branchLength,
        width: door.width,
        height: door.height,
        archRise: door.archRise,
        capEnd: variation.kind === 'deadEnd',
        lengthSegments: 8,
        revealDepth: 0,
      });
    }

    if (variation.kind === 'room') {
      made.room = createRoom({
        depth: config.branchRoomDepth,
        width: config.branchRoomWidth,
        height: Math.max(door.height + 1, config.branchRoomHeight),
        doorWidth: door.width,
        doorHeight: door.height,
        doorArchRise: door.archRise,
      });
    }
    return made;
  }, [along, config, door, hasOpening, segment, side, variation.kind]);

  useEffect(
    () => () => Object.values(parts).forEach((part) => part?.dispose?.()),
    [parts]
  );

  // The corridor's side wall is not parallel to its axis — the section tapers,
  // so the wall slides in or out across the width of a doorway. A branch
  // squared to the axis therefore meets a slanted wall and leaves a sliver of
  // daylight at one jamb. Sink it by more than the wall can deviate over the
  // opening and the two always overlap instead.
  const slant =
    (Math.abs(segment.widthEnd - segment.widthStart) * door.width) /
    (4 * segment.length);
  const sideOffset = midWidth * 0.5 - slant - 0.02;
  const sideRotation = side === 1 ? -Math.PI / 2 : Math.PI / 2;
  const branchDepth =
    variation.kind === 'room' ? config.branchRoomDepth : config.deadEndLength;

  return (
    <>
      <mesh
        castShadow
        geometry={parts.corridor}
        material={material}
        receiveShadow
      />
      {parts.bulkhead && (
        <mesh
          castShadow
          geometry={parts.bulkhead}
          material={material}
          position={[segment.length, 0, 0]}
          receiveShadow
        />
      )}
      {(parts.branch || parts.room) && (
        <mesh
          castShadow
          geometry={parts.branch ?? parts.room}
          material={material}
          position={[along, 0, side * sideOffset]}
          receiveShadow
          rotation={[0, sideRotation, 0]}
        />
      )}
      {/* Somebody was here and left, which is the only human trace in the
          piece. Never in the corridor itself — always around a corner, so
          what reaches the walker is the spill and not the source. */}
      {hasFlare && variation.kind !== 'plain' && (
        <Flare
          config={config}
          flares={flares}
          position={[along, 0, side * (sideOffset + branchDepth * 0.7)]}
          seed={segment.index}
        />
      )}
    </>
  );
}

export default memo(CorridorUnit);
