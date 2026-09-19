import {
  angleAt,
  angleRateAt,
  axisAt,
  wallRadiusAt,
} from '@modules/houseOfLeaves';

import { yawAlong } from '../frames';

const RIM_MARGIN = 0.5;

// Where the corridor ends and the descent begins. Enormous by design: the
// source puts the ceiling past five hundred feet and the span near a mile, so
// the room is defined by what the lamp fails to reach rather than by any wall
// the walker can find. The floor is pierced by the stairwell's mouth, which
// sits on the shaft's own axis at u = 0 — the room and the shaft share a frame
// so the two can never disagree about where that is.
export default function createGreatRoomZone(config, { lap, frame }) {
  const p = config.shaft;
  const halfDepth = config.roomSize * 0.5;
  const half = config.roomSize * 0.5 - config.walkerRadius;
  const drift = axisAt(0, p);
  const hole = { x: drift.x, z: drift.z, radius: wallRadiusAt(0, p) };

  // The one place the rim is not a wall: the top landing, where stepping over
  // the edge is the way on rather than a fall. It sweeps *forward* from u=0.
  const landingAngle = angleAt(0, p);
  const plateau =
    (p.landingArc * Math.PI * 2) / Math.max(1e-4, Math.abs(angleRateAt(0, p)));
  const sweep = angleAt(plateau, p) - landingAngle;

  const bearingOf = (x, z) => Math.atan2(z - hole.z, x - hole.x);
  const overLanding = (x, z) => {
    const delta = bearingOf(x, z) - landingAngle;
    const wrapped = Math.atan2(Math.sin(delta), Math.cos(delta));
    return sweep >= 0
      ? wrapped >= 0 && wrapped <= sweep
      : wrapped <= 0 && wrapped >= sweep;
  };

  const clampToRim = (x, z) => {
    const dx = x - hole.x;
    const dz = z - hole.z;
    const radius = Math.hypot(dx, dz);
    const limit = hole.radius + RIM_MARGIN;
    if (radius >= limit || overLanding(x, z)) return { x, z };
    const scale = radius > 1e-4 ? limit / radius : 1;
    return { x: hole.x + dx * scale, z: hole.z + dz * scale };
  };

  return {
    kind: 'greatRoom',
    id: `greatRoom#${lap}`,
    lap,
    frame,
    hole,
    landingAngle,
    landingSweep: sweep,

    spawn: () => ({ x: -halfDepth + 1, z: 0 }),
    // In the doorway itself: the corridor's far end and the room's near wall
    // are the same plane, so entering anywhere else is a lurch.
    enter: ({ lateral = 0 } = {}) => ({
      x: -halfDepth + 0.02,
      z: Math.max(-half, Math.min(half, lateral)),
    }),
    frameOf: () => null,

    step: (current, delta) => {
      const local = frame.deltaToLocal(delta.x, delta.z);
      const x = Math.max(-half, Math.min(half, current.x + local.x));
      const z = Math.max(-half, Math.min(half, current.z + local.z));
      return clampToRim(x, z);
    },

    place: (current, out) => {
      const world = frame.toWorld(current.x, current.z);
      return out.set(world.x, frame.y, world.z);
    },
    facing: () => yawAlong(frame),
    progress: (current) => current.x + halfDepth,

    exit: (current) => {
      const radius = Math.hypot(current.x - hole.x, current.z - hole.z);
      return radius <= hole.radius - config.walkerRadius &&
        overLanding(current.x, current.z)
        ? { to: 'shaft', radius, angle: bearingOf(current.x, current.z) }
        : null;
    },

    near: (pos, margin) => {
      const local = frame.toLocal(pos.x, pos.z);
      return (
        Math.abs(local.x) < halfDepth + margin &&
        Math.abs(local.z) < halfDepth + margin &&
        pos.y < frame.y + margin &&
        pos.y > frame.y - margin * 1.5
      );
    },
    bearingOf,
    overLanding,
  };
}
