import { createFrame, yawAlong } from '../frames';

// The ordinary room, and the only place with a light switch. Local +X points
// at the north wall, which stands at x = 0 with the doorway in it; the room
// lies behind it in -X. The doorway's state lives here because whether the
// walker can pass through the wall is a fact about this room.
export default function createLivingRoomZone(config, { lap, frame, arrived }) {
  const depth = config.livingDepth;
  const width = config.livingWidth;
  const r = config.walkerRadius;
  const half = width * 0.5 - r;
  const door = {
    z: config.livingDoorZ,
    width: config.startWidth,
    height: config.startHeight,
  };
  const halfDoor = Math.max(0.05, door.width * 0.5 - r);
  const inLane = (z) => Math.abs(z - door.z) <= halfDoor;

  // Arriving from the return hallway the doorway is standing open behind the
  // walker; on the first lap the wall is whole. `attached` says which hallway
  // the open doorway currently belongs to, so only that one is drawn.
  const state = {
    open: !!arrived,
    attached: arrived ? 'return' : null,
    requested: !!arrived,
    requestedAttachment: arrived ? 'return' : null,
    request(open, attachment = 'next') {
      state.requested = open;
      state.requestedAttachment = open ? attachment : null;
    },
    // Called by the room once the wall is out of frame.
    settle() {
      state.open = state.requested;
      state.attached = state.requestedAttachment;
    },
    pending: () => state.open !== state.requested,
  };

  return {
    kind: 'livingRoom',
    lap,
    id: `livingRoom#${lap}`,
    frame,
    door,
    doorState: state,
    depth,
    width,
    height: config.livingHeight,

    spawn: () => ({ x: -depth * 0.55, z: 0.3 }),
    // Through the passage from the return hallway, keeping the cross-track
    // offset; the corridor's z runs the other way once turned to face in.
    enter: ({ lateral = 0 } = {}) => ({
      x: config.wallThickness,
      z: Math.max(-half, Math.min(half, door.z - lateral)),
    }),
    frameOf: () => null,

    step: (current, delta) => {
      const local = frame.deltaToLocal(delta.x, delta.z);
      const z = Math.max(-half, Math.min(half, current.z + local.z));
      const throughWall = state.open && inLane(z);
      const maxX = throughWall ? config.wallThickness + 1 : -r;
      const x = Math.max(-depth + r, Math.min(maxX, current.x + local.x));
      return { x, z };
    },

    place: (current, out) => {
      const world = frame.toWorld(current.x, current.z);
      return out.set(world.x, frame.y, world.z);
    },
    facing: () => yawAlong(frame),
    progress: (current) => current.x,

    // Out through the passage into the next hallway.
    exit: (current) =>
      current.x >= config.wallThickness &&
      state.open &&
      state.attached === 'next'
        ? {
            to: 'corridor',
            along: current.x - config.wallThickness,
            lateral: current.z - door.z,
          }
        : null,

    near: (pos, margin) => {
      const local = frame.toLocal(pos.x, pos.z);
      return (
        local.x > -depth - margin &&
        local.x < margin &&
        Math.abs(local.z) < width * 0.5 + margin &&
        Math.abs(pos.y - frame.y) < margin
      );
    },
    doorWorld: () => {
      const p = frame.toWorld(0, door.z);
      return { x: p.x, y: frame.y + door.height * 0.5, z: p.z };
    },
  };
}

export { createFrame };
