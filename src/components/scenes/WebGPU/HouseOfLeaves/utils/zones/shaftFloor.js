import {
  angleAt,
  axisAt,
  riseTo,
  shaftFloorDoorways,
  wallRadiusAt,
} from '@modules/houseOfLeaves';

import { yawFromDirection } from '../frames';

// The bottom of the shaft, in the shaft's own frame. Hallways leave it like
// spokes on a wagon wheel, all dark, none of them hinting which way is on —
// and whichever is taken, the walk resumes in a corridor.
export default function createShaftFloorZone(config, { lap, frame }) {
  const p = config.shaft;
  const centre = axisAt(p.descentLength, p);
  const wallRadius = wallRadiusAt(p.descentLength, p);
  const floorY = frame.y - riseTo(p.descentLength, p);
  const limit = wallRadius - config.walkerRadius;
  const reach = wallRadius + config.spokeLength;

  const exits = shaftFloorDoorways({
    count: config.floorExits,
    radius: wallRadius,
    baseWidth: config.corridorWidth,
    baseHeight: config.corridorHeight,
    variance: config.floorExitVariance,
    avoidAngle: angleAt(p.descentLength, p),
    seed: lap,
  });

  const bearingOf = (x, z) => Math.atan2(z - centre.z, x - centre.x);
  // Its angular half-width shrinks as the doorway widens relative to the
  // shaft, so a human-sized door in a sixty-metre shaft is a genuinely narrow
  // target to find in the dark.
  const doorwayAt = (x, z) => {
    const angle = bearingOf(x, z);
    return exits.find((exit) => {
      const delta = angle - exit.angle;
      const wrapped = Math.atan2(Math.sin(delta), Math.cos(delta));
      return (
        Math.abs(wrapped) <=
        (exit.width * 0.5 - config.walkerRadius) / wallRadius
      );
    });
  };

  return {
    kind: 'shaftFloor',
    id: `shaftFloor#${lap}`,
    lap,
    frame,
    centre,
    wallRadius,
    floorY,
    exits,

    spawn: () => ({ x: centre.x + limit * 0.6, z: centre.z }),
    enter: ({ radius = 0, angle = 0 } = {}) => {
      const r = Math.min(limit, Math.max(0, radius));
      return {
        x: centre.x + Math.cos(angle) * r,
        z: centre.z + Math.sin(angle) * r,
      };
    },
    frameOf: () => null,

    step: (current, delta) => {
      const local = frame.deltaToLocal(delta.x, delta.z);
      const x = current.x + local.x;
      const z = current.z + local.z;
      const dx = x - centre.x;
      const dz = z - centre.z;
      const radius = Math.hypot(dx, dz);
      if (radius <= limit) return { x, z };
      if (doorwayAt(x, z) && radius <= reach + 0.5) return { x, z };
      const scale = limit / radius;
      return { x: centre.x + dx * scale, z: centre.z + dz * scale };
    },

    place: (current, out) => {
      const world = frame.toWorld(current.x, current.z);
      return out.set(world.x, floorY, world.z);
    },
    facing: (current) => {
      const bearing = frame.heading + bearingOf(current.x, current.z);
      return yawFromDirection(-Math.cos(bearing), -Math.sin(bearing));
    },
    progress: (current) =>
      Math.hypot(current.x - centre.x, current.z - centre.z),

    // Out through a spoke and the walk resumes in a corridor — the way back.
    exit: (current) => {
      const radius = Math.hypot(current.x - centre.x, current.z - centre.z);
      const door = doorwayAt(current.x, current.z);
      if (!(radius >= reach && door)) return null;
      const dx = current.x - centre.x;
      const dz = current.z - centre.z;
      return {
        to: 'returnCorridor',
        door,
        along: dx * Math.cos(door.angle) + dz * Math.sin(door.angle) - reach,
        lateral: -dx * Math.sin(door.angle) + dz * Math.cos(door.angle),
      };
    },

    near: (pos, margin) => {
      const local = frame.toLocal(pos.x, pos.z);
      return (
        Math.hypot(local.x - centre.x, local.z - centre.z) <
          wallRadius + margin && Math.abs(pos.y - floorY) < margin * 1.5
      );
    },
    // World yaw that looks at an exit from the floor's centre.
    exitYaw: (exit) => {
      const bearing = frame.heading + exit.angle;
      return yawFromDirection(Math.cos(bearing), Math.sin(bearing));
    },
    exitPoint: (exit, radius) => ({
      x: centre.x + Math.cos(exit.angle) * radius,
      z: centre.z + Math.sin(exit.angle) * radius,
    }),
  };
}
