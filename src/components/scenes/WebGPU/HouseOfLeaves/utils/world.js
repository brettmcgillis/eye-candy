import { createFrame, frameThroughPoint } from './frames';
import {
  createCorridorZone,
  createGreatRoomZone,
  createLivingRoomZone,
  createShaftFloorZone,
  createShaftZone,
} from './zones';

// The spaces, chained lap by lap and placed relative to one another so the
// whole walk is one coordinate system: the corridor's far end *is* the room's
// doorway, the room's hole *is* the head of the shaft, and the living room at
// the end of the way back is the same zone laid down again where the return
// hallway happens to end. Zones are created as the walk reaches them.
export default function createWorld(config) {
  const zones = [];
  const byId = new Map();
  const add = (zone) => {
    zones.push(zone);
    byId.set(zone.id, zone);
    return zone;
  };
  const cached = (id, build) => byId.get(id) ?? add(build());

  const world = {
    zones,
    start: () =>
      cached('livingRoom#0', () =>
        createLivingRoomZone(config, {
          lap: 0,
          frame: createFrame({ x: 0, y: 0, z: 0, heading: 0 }),
          arrived: null,
        })
      ),

    next(zone, handoff) {
      const { lap } = zone;
      switch (handoff.to) {
        case 'corridor': {
          const f = zone.frame;
          const origin = f.toWorld(config.wallThickness, zone.door.z);
          return cached(`corridor#${lap}`, () =>
            createCorridorZone(config, {
              id: `corridor#${lap}`,
              lap,
              frame: createFrame({
                x: origin.x,
                y: f.y,
                z: origin.z,
                heading: f.heading,
              }),
              length: config.hallLength,
              exitTo: 'greatRoom',
              role: 'out',
              seed: lap * 2,
            })
          );
        }
        case 'greatRoom': {
          const f = zone.frame;
          const c = f.toWorld(zone.length + config.roomSize * 0.5, 0);
          return cached(`greatRoom#${lap}`, () =>
            createGreatRoomZone(config, {
              lap,
              frame: createFrame({
                x: c.x,
                y: f.y,
                z: c.z,
                heading: f.heading,
              }),
            })
          );
        }
        case 'shaft':
          return cached(`shaft#${lap}`, () =>
            createShaftZone(config, { lap, frame: zone.frame })
          );
        case 'shaftFloor':
          return cached(`shaftFloor#${lap}`, () =>
            createShaftFloorZone(config, { lap, frame: zone.frame })
          );
        case 'returnCorridor': {
          const { door } = handoff;
          const f = zone.frame;
          const reach = zone.wallRadius + config.spokeLength;
          const start = f.toWorld(
            zone.centre.x + Math.cos(door.angle) * reach,
            zone.centre.z + Math.sin(door.angle) * reach
          );
          return cached(`return#${lap}`, () =>
            createCorridorZone(config, {
              id: `return#${lap}`,
              lap,
              frame: createFrame({
                x: start.x,
                y: zone.floorY,
                z: start.z,
                heading: f.heading + door.angle,
              }),
              length: config.returnLength,
              exitTo: 'livingRoom',
              role: 'return',
              entry: { width: door.width, height: door.height },
              seed: lap * 2 + 1,
            })
          );
        }
        case 'livingRoom': {
          // The passage's outer face is where the return hallway ends; the
          // room stands beyond it, turned to face back the way we came.
          const f = zone.frame;
          const doorPoint = f.toWorld(zone.length + config.wallThickness, 0);
          const heading = f.heading + Math.PI;
          return cached(`livingRoom#${lap + 1}`, () =>
            createLivingRoomZone(config, {
              lap: lap + 1,
              frame: frameThroughPoint(
                { x: doorPoint.x, y: f.y, z: doorPoint.z },
                heading,
                0,
                config.livingDoorZ
              ),
              arrived: zone,
            })
          );
        }
        default:
          throw new Error(`No zone after ${zone.id} for ${handoff.to}`);
      }
    },

    // Begin partway round: the chain up to the named zone is created as the
    // walk would create it, with the first door standing open.
    startAt(kind) {
      const room = world.start();
      if (kind === 'livingRoom') return room;
      room.doorState.request(true, 'next');
      room.doorState.settle();
      const corridor = world.next(room, { to: 'corridor' });
      if (kind === 'corridor') return corridor;
      const greatRoom = world.next(corridor, { to: 'greatRoom' });
      if (kind === 'greatRoom') return greatRoom;
      const shaft = world.next(greatRoom, { to: 'shaft' });
      if (kind === 'shaft') return shaft;
      const floor = world.next(shaft, { to: 'shaftFloor' });
      if (kind === 'shaftFloor') return floor;
      return world.next(floor, { to: 'returnCorridor', door: floor.exits[0] });
    },

    // The corridor a living room's open doorway currently belongs to.
    corridorFor(livingRoom) {
      const { attached } = livingRoom.doorState;
      if (attached === 'next') return byId.get(`corridor#${livingRoom.lap}`);
      if (attached === 'return')
        return byId.get(`return#${livingRoom.lap - 1}`);
      return null;
    },
    get: (id) => byId.get(id),
  };
  return world;
}
