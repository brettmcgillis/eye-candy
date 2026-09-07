import {
  angleAt,
  axisAt,
  landingAt,
  landingsInRange,
  riseAt,
  voidRadiusAt,
} from '@modules/houseOfLeaves';

const RIM_MARGIN = 0.45;

// The stair is walked in (u, r): path along the helix, and radius out from the
// void. That makes the clamp trivial — r between the rim and the wall — and it
// makes descending, backing up and strafing to the edge all the same
// operation. A world-space position is derived from the pair, never stored.
export default function createShaftZone(config) {
  const p = config.shaft;
  const { stairWidth } = config;
  // The shaft hangs from the room's hole, so its axis is offset into the same
  // world the corridor and the room are laid out in.
  const origin = config.origin ?? { x: 0, z: 0 };
  const behind = config.streamBehind + p.landingSpacing * 2;
  const ahead = config.streamAhead + p.landingSpacing * 2;

  // Height is measured from the walker, not from an absolute origin. The
  // landing set slides forward as the walk goes on, and a plateau dropping off
  // the back of it would stop being counted — every landing passed would jolt
  // the whole world upward by its own depth. Referencing the walker makes both
  // terms shift together, so the difference is stable.
  //
  // The frame is also what the streamed geometry reads, so the stair the
  // walker stands on and the stair that gets drawn are resolved from one
  // landing set and cannot disagree.
  const frame = (state) => {
    const landings = landingsInRange(state.u - behind, state.u + ahead, p);
    return { landings, riseRef: riseAt(state.u, landings) };
  };

  const heightIn = (u, current) =>
    -(riseAt(u, current.landings) - current.riseRef);

  const positionAt = (u, r, current, out) => {
    const axis = axisAt(u, p);
    const angle = angleAt(u, p);
    return out.set(
      origin.x + axis.x + Math.cos(angle) * r,
      heightIn(u, current),
      origin.z + axis.z + Math.sin(angle) * r
    );
  };

  // Only a clamp, so it reads a narrow local window rather than the frame —
  // nothing downstream depends on this being continuous.
  const bandAt = (u) => {
    const inner = voidRadiusAt(u, p);
    const local = landingsInRange(
      u - p.landingSpacing * 2,
      u + p.landingSpacing * 2,
      p
    );
    const overshoot = landingAt(u, local) ? config.landingOvershoot : 0;
    return {
      min: inner - overshoot + RIM_MARGIN,
      max: inner + stairWidth - config.walkerRadius,
    };
  };

  return {
    id: 'shaft',
    spawn: () => ({ u: 0, r: voidRadiusAt(0, p) + stairWidth * 0.5 }),
    frame,

    // The step arrives in world space, so it has to be resolved back onto the
    // helix. The tangent is taken by finite difference rather than
    // analytically: it then accounts for axis drift and for the plateaus,
    // where the tangent is horizontal, without either being special-cased.
    step: (state, delta, scratch, current) => {
      const { a, b } = scratch;
      const h = 0.25;
      positionAt(state.u - h, state.r, current, a);
      positionAt(state.u + h, state.r, current, b);
      const tx = (b.x - a.x) / (2 * h);
      const ty = (b.y - a.y) / (2 * h);
      const tz = (b.z - a.z) / (2 * h);
      const flat = Math.hypot(tx, tz);
      // The command is a horizontal step, but the walker is on a slope. Divide
      // by the full 3-D tangent rather than its horizontal part, or the drop
      // is added on top of the commanded distance and walking speed quietly
      // rises with the pitch of the stair.
      const solid = Math.hypot(flat, ty);

      const angle = angleAt(state.u, p);
      const du =
        flat > 1e-4 ? (delta.x * tx + delta.z * tz) / (flat * solid) : 0;
      const dr = delta.x * Math.cos(angle) + delta.z * Math.sin(angle);

      const u = state.u + du;
      const band = bandAt(u);
      return { u, r: Math.max(band.min, Math.min(band.max, state.r + dr)) };
    },

    place: (state, out, current) => positionAt(state.u, state.r, current, out),

    // Arriving from the great room. The room's hole is centred on the shaft's
    // own axis at u=0, so the two frames agree there — but only if the walker
    // keeps the bearing they stepped in on. Dropping it puts them back at the
    // landing's leading edge, which is a jump of the landing's whole arc: at
    // this radius, tens of metres sideways.
    //
    // Angle is a function of u, so the bearing is solved back into one. The
    // warp is capped to keep that function monotonic, which is what makes the
    // bisection safe.
    enter: ({ lateral, angle } = {}) => {
      const band = bandAt(0);
      const r = lateral ?? voidRadiusAt(0, p) + stairWidth * 0.5;
      let u = 0;
      if (angle !== undefined) {
        const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
        const span = (Math.PI * 2 * p.landingArc) / (Math.PI * 2);
        let lo = 0;
        let hi = Math.max(1, p.risePerTurn * span * 1.5);
        for (let i = 0; i < 40; i += 1) {
          const mid = (lo + hi) * 0.5;
          if (wrap(angleAt(mid, p) - angle) < 0) lo = mid;
          else hi = mid;
        }
        u = (lo + hi) * 0.5;
      }
      return { u, r: Math.max(band.min, Math.min(band.max, r)) };
    },

    // The descent is endless in feel, not in fact. Below this the floor is
    // real; above it there is nothing under the stair at all.
    exit: (state) =>
      state.u >= config.descentLength
        ? {
            to: 'shaftFloor',
            lateral: state.r,
            angle: angleAt(state.u, p),
          }
        : null,

    // Facing down the helix, not down -Z: the tangent is where "forward" has
    // to point or the first step is taken across the stair rather than along
    // it. Derived from the same finite difference the step uses.
    facing: (state, current, scratch) => {
      const { a, b } = scratch;
      positionAt(state.u - 0.25, state.r, current, a);
      positionAt(state.u + 0.25, state.r, current, b);
      return Math.atan2(-(b.x - a.x), -(b.z - a.z));
    },
    height: heightIn,
    progress: (state) => state.u,
  };
}
