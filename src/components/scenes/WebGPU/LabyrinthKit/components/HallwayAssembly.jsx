import React, { memo, useEffect, useMemo } from 'react';

import {
  Flare,
  createHallway,
  createRoom,
  hallwaySideDoor,
} from '@modules/houseOfLeaves';

// A corridor plus, optionally, a room at its end or off either side. The side
// doorway is cut into the hallway's own wall and the room is rotated onto it,
// so the two always share an opening.
function HallwayAssembly({
  castShadows = false,
  config,
  material,
  room: roomSide,
  flare,
  seed = 0,
}) {
  const isSide = roomSide === 'Left' || roomSide === 'Right';
  const sideSign = roomSide === 'Left' ? -1 : 1;
  // A room at the end wants a short hall so it reads; a side room wants a long
  // one, with the room near the entrance so it is visible from the shaft.
  const length =
    roomSide === 'End' ? config.tunnelLengthEndRoom : config.tunnelLength;
  const along = Math.min(length * config.roomAlong, length * 0.5);
  const sideDoor = hallwaySideDoor({
    width: config.mouthWidth,
    height: config.mouthHeight,
    archRise: config.mouthWidth * 0.5,
  });

  const hallway = useMemo(
    () =>
      createHallway({
        length,
        width: config.mouthWidth,
        height: config.mouthHeight,
        archRise: config.mouthWidth * 0.5,
        capEnd: roomSide === 'End' ? false : config.hallwayCapEnd,
        mouthCurveRadius: config.wallRadius,
        revealDepth: config.revealDepth,
        sideOpenings: isSide
          ? [
              {
                side: sideSign,
                at: along,
                width: sideDoor.width,
                height: sideDoor.height,
              },
            ]
          : [],
      }),
    [
      along,
      config.hallwayCapEnd,
      config.mouthHeight,
      config.mouthWidth,
      length,
      isSide,
      roomSide,
      sideSign,
    ]
  );

  const room = useMemo(
    () =>
      roomSide
        ? createRoom({
            depth: config.roomDepth,
            width: config.roomWidth,
            height: config.roomHeight,
            doorWidth: isSide ? sideDoor.width : config.mouthWidth,
            doorHeight: isSide ? sideDoor.height : config.mouthHeight,
            doorArchRise: isSide ? sideDoor.archRise : config.mouthWidth * 0.5,
          })
        : null,
    [
      config.mouthHeight,
      config.mouthWidth,
      config.roomDepth,
      config.roomHeight,
      config.roomWidth,
      isSide,
      roomSide,
    ]
  );

  useEffect(
    () => () => {
      hallway.dispose();
      room?.dispose();
    },
    [hallway, room]
  );

  // Deep into the room and off to one side, so from the corridor only the
  // spill is visible and never the source.
  const flarePosition = useMemo(() => {
    if (flare === 'hallway' || !roomSide)
      return [length * 0.55, 0.02, config.mouthWidth * 0.3];
    if (!isSide) {
      return [length + config.roomDepth * 0.75, 0.02, config.roomWidth * 0.32];
    }
    // A side room is rotated a quarter turn, so its depth runs along Z and its
    // width along X — placing the flare by depth on X put it outside the room.
    return [
      along + config.roomWidth * 0.28,
      0.02,
      sideSign * (config.mouthWidth * 0.5 + config.roomDepth * 0.72),
    ];
  }, [
    along,
    config.mouthWidth,
    config.roomDepth,
    config.roomWidth,
    length,
    isSide,
    roomSide,
    sideSign,
  ]);

  return (
    <>
      <mesh castShadow receiveShadow geometry={hallway} material={material} />
      {room && !isSide && (
        <mesh
          castShadow
          receiveShadow
          geometry={room}
          material={material}
          position={[length, 0, 0]}
        />
      )}
      {room && isSide && (
        <mesh
          castShadow
          receiveShadow
          geometry={room}
          material={material}
          position={[along, 0, sideSign * config.mouthWidth * 0.5]}
          rotation={[0, sideSign === 1 ? -Math.PI / 2 : Math.PI / 2, 0]}
        />
      )}
      {(flare === 'hallway' || flare === 'room') && (
        <Flare
          color={config.flareColor}
          glow={config.flareGlow}
          intensity={config.flareIntensity}
          length={config.flareLength}
          position={flarePosition}
          radius={config.flareRadius}
          range={config.flareRange}
          shadows={castShadows}
          seed={seed}
        />
      )}
    </>
  );
}

export default memo(HallwayAssembly);
