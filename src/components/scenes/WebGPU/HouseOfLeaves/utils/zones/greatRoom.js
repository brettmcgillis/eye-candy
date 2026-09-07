import {
  angleAt,
  angleRateAt,
  axisAt,
  voidRadiusAt,
} from '@modules/houseOfLeaves';

const RIM_MARGIN = 0.5;

// Where the corridor ends and the descent begins. Enormous by design: the
// source puts the ceiling past five hundred feet and the span near a mile, so
// the room is defined by what the lamp fails to reach rather than by any wall
// the walker can find. The floor is pierced by the stairwell's mouth.
//
// Its hole is centred on the shaft's own axis at u=0, which is what lets the
// walker step off the rim onto the top landing without either frame moving.
export default function createGreatRoomZone(config) {
  const p = config.shaft;
  const origin = config.origin ?? { x: 0, z: 0 };
  const half = config.roomSize * 0.5 - config.walkerRadius;
  const drift = axisAt(0, p);
  const hole = { x: origin.x + drift.x, z: origin.z + drift.z };
  const holeRadius = voidRadiusAt(0, p) + config.stairWidth;

  // The one place the rim is not a wall: the top landing, where stepping over
  // the edge is the way on rather than a fall.
  //
  // The landing sweeps *forward* from u=0 — it does not straddle it. Treating
  // it as centred lets the walker step off the half of the arc that has no
  // stair under it, and the shaft then has no `u` to put them at, so they
  // arrive at the landing's leading edge instead: a jump of the whole arc,
  // tens of metres at this radius.
  const landingAngle = angleAt(0, p);
  const plateau =
    (p.landingArc * Math.PI * 2) / Math.max(1e-4, Math.abs(angleRateAt(0, p)));
  const sweep = angleAt(plateau, p) - landingAngle;

  const overLanding = (x, z) => {
    const delta = Math.atan2(z - hole.z, x - hole.x) - landingAngle;
    const wrapped = Math.atan2(Math.sin(delta), Math.cos(delta));
    return sweep >= 0
      ? wrapped >= 0 && wrapped <= sweep
      : wrapped <= 0 && wrapped >= sweep;
  };

  const clampToRim = (x, z) => {
    const dx = x - hole.x;
    const dz = z - hole.z;
    const radius = Math.hypot(dx, dz);
    const limit = holeRadius + RIM_MARGIN;
    if (radius >= limit || overLanding(x, z)) return { x, z };
    // Pushed back out along its own bearing, so sliding along the rim feels
    // like a wall rather than a snap to some fixed point on the circle.
    const scale = radius > 1e-4 ? limit / radius : 1;
    return { x: hole.x + dx * scale, z: hole.z + dz * scale };
  };

  return {
    id: 'greatRoom',

    // Just inside the doorway on the -X wall, which is where the corridor
    // arrives.
    spawn: () => ({ x: origin.x - half + 1, z: origin.z }),
    // Standing in the doorway itself, not a metre past it: the corridor's far
    // end and the room's near wall are the same plane, so entering anywhere
    // else is a lurch forward the moment the zones change hands.
    enter: ({ lateral = 0 } = {}) => ({
      x: origin.x - config.roomSize * 0.5,
      z: origin.z + Math.max(-half, Math.min(half, lateral)),
    }),
    frame: () => null,

    step: (state, delta) => {
      const x = Math.max(
        origin.x - half,
        Math.min(origin.x + half, state.x + delta.x)
      );
      const z = Math.max(
        origin.z - half,
        Math.min(origin.z + half, state.z + delta.z)
      );
      return clampToRim(x, z);
    },

    place: (state, out) => out.set(state.x, 0, state.z),
    height: () => 0,
    // Facing the hole from the doorway: the room is crossed toward its centre.
    facing: () => -Math.PI / 2,
    progress: (state) => state.x,

    exit: (state) => {
      const radius = Math.hypot(state.x - hole.x, state.z - hole.z);
      // Fired once the walker is inside the radius the stair will accept, not
      // at the rim: handing over a shoulder's width outside the band means the
      // shaft's own clamp pulls them in, which is a lurch at the threshold.
      return radius <= holeRadius - config.walkerRadius &&
        overLanding(state.x, state.z)
        ? {
            to: 'shaft',
            lateral: radius,
            angle: Math.atan2(state.z - hole.z, state.x - hole.x),
          }
        : null;
    },
  };
}
