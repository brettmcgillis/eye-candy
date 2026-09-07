import {
  axisAt,
  shaftFloorDoorways,
  voidRadiusAt,
} from '@modules/houseOfLeaves';

// The bottom of the shaft. Hallways leave it like spokes on a wagon wheel, all
// dark, none of them hinting which way is on — and whichever is taken, the
// walk resumes in a corridor.
export default function createShaftFloorZone(config) {
  const p = config.shaft;
  const placed = config.origin ?? { x: 0, z: 0 };
  // The shaft does not fall straight: its axis wanders as it descends, so the
  // floor sits under wherever the bottom of the stair actually is. Anchoring
  // it to the room's hole instead drops the walker metres sideways the moment
  // the last flight ends.
  const drift = axisAt(config.descentLength, config.shaft);
  const origin = { x: placed.x + drift.x, z: placed.z + drift.z };
  const wallRadius = voidRadiusAt(config.descentLength, p) + config.stairWidth;
  const limit = wallRadius - config.walkerRadius;

  const exits = shaftFloorDoorways({
    count: config.floorExits,
    radius: wallRadius,
    baseWidth: config.corridorWidth,
    baseHeight: config.corridorHeight,
    variance: config.floorExitVariance,
    archRatio: config.archRatio,
    avoidAngle: 0,
  });

  // Which doorway, if any, a bearing falls inside. Its angular half-width
  // shrinks as the doorway widens relative to the shaft, so a human-sized door
  // in a sixty-metre shaft is a genuinely narrow target to find in the dark.
  const doorwayAt = (x, z) => {
    const angle = Math.atan2(z - origin.z, x - origin.x);
    return exits.find((exit) => {
      const delta = angle - exit.angle;
      const wrapped = Math.atan2(Math.sin(delta), Math.cos(delta));
      return Math.abs(wrapped) <= exit.width / (2 * wallRadius);
    });
  };

  return {
    id: 'shaftFloor',
    spawn: () => ({ x: origin.x + limit * 0.6, z: origin.z }),

    // Arriving off the last flight — at the radius *and the bearing* the stair
    // left the walker on. Keeping only the radius lands them at zero degrees,
    // which is a jump of up to the full diameter of the shaft.
    enter: ({ lateral = 0, angle = 0 } = {}) => {
      const r = Math.min(limit, Math.max(0, lateral));
      return {
        x: origin.x + Math.cos(angle) * r,
        z: origin.z + Math.sin(angle) * r,
      };
    },
    frame: () => null,

    step: (state, delta) => {
      const x = state.x + delta.x;
      const z = state.z + delta.z;
      const dx = x - origin.x;
      const dz = z - origin.z;
      const radius = Math.hypot(dx, dz);
      if (radius <= limit || doorwayAt(x, z)) return { x, z };
      const scale = limit / radius;
      return { x: origin.x + dx * scale, z: origin.z + dz * scale };
    },

    place: (state, out) => out.set(state.x, 0, state.z),
    height: () => 0,
    facing: (state) => Math.atan2(-(state.x - origin.x), -(state.z - origin.z)),
    progress: (state) => Math.hypot(state.x - origin.x, state.z - origin.z),

    // Out through a spoke and the walk resumes in a corridor — the way back.
    exit: (state) => {
      const radius = Math.hypot(state.x - origin.x, state.z - origin.z);
      const door = doorwayAt(state.x, state.z);
      if (!(radius > wallRadius && door)) return null;
      // Where across the doorway the walker actually is. Handing over zero
      // instead puts them on the corridor's centreline, which is a sidestep of
      // up to half the doorway's width at the moment it changes hands.
      const dx = state.x - origin.x;
      const dz = state.z - origin.z;
      return {
        to: 'returnCorridor',
        along:
          dx * Math.cos(door.angle) + dz * Math.sin(door.angle) - wallRadius,
        lateral: -dx * Math.sin(door.angle) + dz * Math.cos(door.angle),
        door,
        centre: { x: origin.x, z: origin.z, radius: wallRadius },
      };
    },
    exits,
    wallRadius,
  };
}
