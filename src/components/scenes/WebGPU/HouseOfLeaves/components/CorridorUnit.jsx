import React, { memo, useEffect, useMemo } from 'react';

import { createCorridorUnit } from '@modules/houseOfLeaves';

import Flare from './Flare';

// One corridor segment and whatever leaves it — a doorway, a room, a branch
// that carries on, or a branch that stops a few metres in — as one surface.
// Dead ends are only ever placed to the side; the way ahead is never closed.
function CorridorUnit({
  config,
  entry,
  flares,
  hasFlare,
  material,
  segment,
  variation,
}) {
  const midWidth = (segment.widthStart + segment.widthEnd) * 0.5;
  const midHeight = (segment.heightStart + segment.heightEnd) * 0.5;

  const door = useMemo(
    () => ({
      width: Math.max(0.8, midWidth * config.branchWidthScale),
      height: Math.max(
        2,
        Math.min(midHeight - 0.3, midHeight * config.branchWidthScale)
      ),
    }),
    [config.branchWidthScale, midHeight, midWidth]
  );

  const built = useMemo(
    () =>
      createCorridorUnit({
        segment,
        variation,
        door,
        entry,
        options: {
          revealDepth: config.revealDepth,
          branchLength: config.branchLength,
          deadEndLength: config.deadEndLength,
          branchRoomWidth: config.branchRoomWidth,
          branchRoomDepth: config.branchRoomDepth,
          branchRoomHeight: config.branchRoomHeight,
        },
      }),
    [
      config.branchLength,
      config.branchRoomDepth,
      config.branchRoomHeight,
      config.branchRoomWidth,
      config.deadEndLength,
      config.revealDepth,
      door,
      entry,
      segment,
      variation,
    ]
  );

  useEffect(() => () => built.geometry.dispose(), [built]);

  const { opening } = built;
  return (
    <>
      <mesh
        castShadow
        geometry={built.geometry}
        material={material}
        receiveShadow
      />
      {/* Somebody was here and left. Never in the corridor itself — always
          around a corner, so what reaches the walker is the spill. */}
      {hasFlare && opening && (
        <Flare
          config={config}
          flares={flares}
          position={[
            opening.along + (opening.kind === 'room' ? 2 : 0),
            0,
            opening.side * (opening.depth * 0.7),
          ]}
          seed={segment.index}
        />
      )}
    </>
  );
}

export default memo(CorridorUnit);
