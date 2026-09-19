import {
  angleAt,
  axisAt,
  landingAt,
  landingsUpTo,
  riseTo,
  uAtRise,
  voidRadiusAt,
  wallRadiusAt,
} from '@modules/houseOfLeaves';

import { yawFromDirection } from '../frames';

const RIM_MARGIN = 0.45;

// The stair is walked in (u, r): path along the helix, and radius out from the
// void. That makes the clamp trivial — r between the rim and the wall — and it
// makes descending, backing up and strafing to the edge all the same
// operation. A world-space position is derived from the pair, never stored.
//
// Heights are absolute: `riseTo` counts every plateau from the top, so the
// stair the walker stands on and the stair that gets drawn are resolved from
// the same function and neither can drift.
export default function createShaftZone(config, { lap, frame }) {
  const p = config.shaft;
  const { stairWidth } = p;

  const positionAt = (u, r, out) => {
    const axis = axisAt(u, p);
    const angle = angleAt(u, p);
    const world = frame.toWorld(
      axis.x + Math.cos(angle) * r,
      axis.z + Math.sin(angle) * r
    );
    return out.set(world.x, frame.y - riseTo(u, p), world.z);
  };

  const bandAt = (u) => {
    const inner = voidRadiusAt(u, p);
    const landings = landingsUpTo(u + p.landingSpacing, p);
    const overshoot = landingAt(u, landings) ? config.landingOvershoot : 0;
    return {
      min: inner - overshoot + RIM_MARGIN,
      max: inner + stairWidth - config.walkerRadius,
    };
  };

  const zone = {
    kind: 'shaft',
    id: `shaft#${lap}`,
    lap,
    frame,
    floorY: frame.y - riseTo(p.descentLength, p),

    spawn: () => ({ u: 0.5, r: voidRadiusAt(0, p) + stairWidth * 0.5 }),
    frameOf: () => null,

    // The step arrives in world space, so it has to be resolved back onto the
    // helix. The tangent is taken by finite difference rather than
    // analytically: it then accounts for axis drift and for the plateaus,
    // where the tangent is horizontal, without either being special-cased.
    step: (current, delta, scratch) => {
      const { a, b } = scratch;
      const h = 0.25;
      positionAt(current.u - h, current.r, a);
      positionAt(current.u + h, current.r, b);
      const tx = (b.x - a.x) / (2 * h);
      const ty = (b.y - a.y) / (2 * h);
      const tz = (b.z - a.z) / (2 * h);
      const flat = Math.hypot(tx, tz);
      // The command is a horizontal step, but the walker is on a slope. Divide
      // by the full 3-D tangent rather than its horizontal part, or the drop
      // is added on top of the commanded distance and walking speed quietly
      // rises with the pitch of the stair.
      const solid = Math.hypot(flat, ty);
      const bearing = frame.heading + angleAt(current.u, p);
      const du =
        flat > 1e-4 ? (delta.x * tx + delta.z * tz) / (flat * solid) : 0;
      const dr = delta.x * Math.cos(bearing) + delta.z * Math.sin(bearing);
      const u = Math.max(0, current.u + du);
      const band = bandAt(u);
      return { u, r: Math.max(band.min, Math.min(band.max, current.r + dr)) };
    },

    place: (current, out) => positionAt(current.u, current.r, out),

    // Arriving from the great room at a bearing: angle is a function of u, so
    // the bearing is solved back into one over the first turn.
    enter: ({ radius, angle } = {}) => {
      const band = bandAt(0);
      const r = radius ?? voidRadiusAt(0, p) + stairWidth * 0.5;
      let u = 0;
      if (angle !== undefined) {
        const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
        let lo = 0;
        const top = landingsUpTo(1, p)[0];
        let hi = Math.max(1, (top?.plateau ?? 8) * 1.5);
        for (let i = 0; i < 40; i += 1) {
          const mid = (lo + hi) * 0.5;
          if (wrap(angleAt(mid, p) - angle) < 0) lo = mid;
          else hi = mid;
        }
        u = (lo + hi) * 0.5;
      }
      return { u, r: Math.max(band.min, Math.min(band.max, r)) };
    },

    exit: (current) =>
      current.u >= p.descentLength
        ? {
            to: 'shaftFloor',
            radius: current.r,
            angle: angleAt(current.u, p),
          }
        : null,

    // Down the helix, not down -Z: derived from the same finite difference
    // the step uses.
    facing: (current, scratch) => {
      const { a, b } = scratch;
      positionAt(current.u - 0.25, current.r, a);
      positionAt(current.u + 0.25, current.r, b);
      return yawFromDirection(b.x - a.x, b.z - a.z);
    },
    progress: (current) => current.u,

    // Which way the void is from where the walker stands, for a glance over
    // the edge: the bearing of the axis from the stair.
    voidYaw: (current) => {
      const bearing = frame.heading + angleAt(current.u, p);
      return yawFromDirection(-Math.cos(bearing), -Math.sin(bearing));
    },

    // How far down the shaft a world position is, for streaming from other
    // zones: rise is monotonic in u.
    uFor: (pos) =>
      Math.max(0, Math.min(p.descentLength, uAtRise(frame.y - pos.y, p))),

    near: (pos, margin) => {
      const local = frame.toLocal(pos.x, pos.z);
      const u = zone.uFor(pos);
      const axis = axisAt(u, p);
      const radius = Math.hypot(local.x - axis.x, local.z - axis.z);
      return (
        radius < wallRadiusAt(u, p) + margin &&
        pos.y < frame.y + margin &&
        pos.y > zone.floorY - margin
      );
    },
  };
  return zone;
}
