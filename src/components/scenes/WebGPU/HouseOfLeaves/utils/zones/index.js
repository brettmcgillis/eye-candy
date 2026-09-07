import { shaftFloorDoorways, voidRadiusAt } from '@modules/houseOfLeaves';

import createCorridorZone from './corridor';
import createGreatRoomZone from './greatRoom';
import createShaftZone from './shaft';
import createShaftFloorZone from './shaftFloor';

// The order the piece is walked in. The return corridor is the same zone as
// the hallway, laid down whichever spoke was taken at the bottom rather than
// along world +X — which is why the corridor is placeable at all.
export const JOURNEY = [
  'corridor',
  'greatRoom',
  'shaft',
  'shaftFloor',
  'returnCorridor',
];

export const ZONE_LABELS = {
  Corridor: 'corridor',
  'Great Room': 'greatRoom',
  Shaft: 'shaft',
  'Shaft Floor': 'shaftFloor',
  Return: 'returnCorridor',
};

function returnCorridor(config) {
  const origin = config.origin ?? { x: 0, z: 0 };
  const wallRadius =
    voidRadiusAt(config.descentLength, config.shaft) + config.stairWidth;
  const exits = shaftFloorDoorways({
    count: config.floorExits,
    radius: wallRadius,
    baseWidth: config.corridorWidth,
    baseHeight: config.corridorHeight,
    variance: config.floorExitVariance,
    archRatio: config.archRatio,
    avoidAngle: 0,
  });
  const door = exits[0] ?? { angle: 0 };
  return createCorridorZone(config, {
    id: 'returnCorridor',
    // Starting at the spoke's mouth and running outward along its own bearing,
    // so leaving the shaft floor is a step rather than a jump across the map.
    origin: {
      x: origin.x + Math.cos(door.angle) * wallRadius,
      y: 0,
      z: origin.z + Math.sin(door.angle) * wallRadius,
    },
    heading: door.angle,
    length: config.returnLength,
    // The living room is the far side of this threshold, and it does not exist
    // yet. Chaining back to the hallway instead would be a cut of the whole
    // length of the piece, so the walk simply ends here until there is
    // somewhere to arrive.
    exitTo: null,
  });
}

const FACTORIES = {
  corridor: (config) => createCorridorZone(config),
  greatRoom: createGreatRoomZone,
  shaft: createShaftZone,
  shaftFloor: createShaftFloorZone,
  returnCorridor,
};

// Matched on the resolved id, never on the display label — a mismatch here
// silently hands back the wrong zone and the walk quietly stops working.
export function createZone(id, config) {
  const key = ZONE_LABELS[id] ?? id;
  return (FACTORIES[key] ?? FACTORIES.corridor)(config);
}
