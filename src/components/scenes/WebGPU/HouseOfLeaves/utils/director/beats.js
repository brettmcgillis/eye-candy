import { hash01 } from '@modules/houseOfLeaves';

import { wrapAngle, yawFromDirection } from '../frames';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const ease = (t) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

// The camera is a performance: each zone has a list of beats, each beat sets
// the drive for the frame and says when it is over. Beats never move the
// walker themselves — they ask, through the drive, and the zone's clamp has
// the last word, which is what keeps the performance honest to the space.

function lookAtWorld(ctx, wx, wz) {
  const { position } = ctx.walker;
  return yawFromDirection(wx - position.x, wz - position.z);
}

// Head toward a world point; returns the remaining distance.
function moveToward(ctx, wx, wz, speed) {
  const { drive, walker } = ctx;
  const dx = wx - walker.position.x;
  const dz = wz - walker.position.z;
  const distance = Math.hypot(dx, dz);
  drive.yaw = lookAtWorld(ctx, wx, wz);
  drive.forward = distance > 0.15 ? 1 : 0;
  drive.strafe = 0;
  drive.speed = speed;
  return distance;
}

function hold(ctx) {
  ctx.drive.forward = 0;
  ctx.drive.strafe = 0;
}

// A full turn on the spot that ends on `endYaw`, taking the long way round.
function sweep({ seconds, endYaw = null, pitch = 0 }) {
  return {
    id: 'sweep',
    enter(ctx) {
      ctx.startYaw = ctx.walker.yaw;
      const extra = endYaw === null ? 0 : wrapAngle(endYaw - ctx.startYaw);
      ctx.total = TAU + (extra < 0 ? extra + TAU : extra);
    },
    update(ctx) {
      hold(ctx);
      const f = ease(ctx.t / seconds);
      ctx.drive.yaw = ctx.startYaw + ctx.total * f;
      ctx.drive.pitch = pitch * DEG + Math.sin(ctx.t * 0.7) * 2.5 * DEG;
      return ctx.t >= seconds + 0.4;
    },
  };
}

function rest({ seconds, yaw = null, pitch = 0 }) {
  return {
    id: 'rest',
    update(ctx) {
      hold(ctx);
      if (yaw !== null) ctx.drive.yaw = yaw(ctx);
      ctx.drive.pitch = pitch * DEG;
      return ctx.t >= seconds;
    },
  };
}

function livingRoomBeats(config) {
  const eyeSeated = 1.15;
  return (zone) => {
    const arrived =
      !!zone.doorState.open && zone.doorState.attached === 'return';
    const door = zone.doorWorld();
    // Aim past the wall, not at it: the hand-over happens in the passage.
    const beyond = zone.frame.toWorld(config.wallThickness + 0.8, zone.door.z);
    const seat = zone.frame.toWorld(-zone.depth * 0.5, zone.width * 0.5 - 0.95);
    const tv = zone.frame.toWorld(-zone.depth * 0.5, -zone.width * 0.5 + 0.5);
    const toDoor = (ctx) => lookAtWorld(ctx, door.x, door.z);
    const toTv = (ctx) => lookAtWorld(ctx, tv.x, tv.z);
    const beats = [];
    if (arrived) {
      // In from the dark: cross to the middle, look back at the way we came,
      // and let the wall close behind us while we are not looking.
      beats.push({
        id: 'arrive',
        enter(ctx) {
          ctx.drive.eyeHeight = config.eyeHeight;
          ctx.drive.speed = config.walkSpeed * 0.7;
        },
        update(ctx) {
          const d = moveToward(ctx, seat.x, seat.z, config.walkSpeed * 0.7);
          ctx.drive.pitch = 0;
          return d < 0.9;
        },
      });
      beats.push(rest({ seconds: 2.2, yaw: toDoor }));
      beats.push({
        ...sweep({ seconds: config.sweepSeconds, endYaw: null }),
        id: 'sweepClose',
        enter(ctx) {
          zone.doorState.request(false);
          ctx.startYaw = ctx.walker.yaw;
          ctx.total = TAU;
        },
      });
      beats.push(rest({ seconds: config.restSeconds * 0.6, yaw: toDoor }));
      beats.push({
        id: 'sit',
        update(ctx) {
          const d = moveToward(ctx, seat.x, seat.z, config.walkSpeed * 0.6);
          if (d < 0.3) ctx.drive.eyeHeight = eyeSeated;
          return d < 0.3 && ctx.t > 1.5;
        },
      });
    } else {
      beats.push({
        id: 'settle',
        enter(ctx) {
          ctx.drive.eyeHeight = eyeSeated;
          ctx.walker.eyeHeight = eyeSeated;
        },
        update(ctx) {
          hold(ctx);
          ctx.drive.yaw = toTv(ctx);
          ctx.drive.pitch = -3 * DEG;
          return ctx.t >= config.restSeconds;
        },
      });
    }
    beats.push(rest({ seconds: config.restSeconds, yaw: toTv, pitch: -3 }));
    // The look round the room that ends on the wall — which has changed
    // while it was behind us.
    beats.push({
      ...sweep({ seconds: config.sweepSeconds }),
      id: 'sweepOpen',
      enter(ctx) {
        zone.doorState.request(true, 'next');
        ctx.startYaw = ctx.walker.yaw;
        const extra = wrapAngle(toDoor(ctx) - ctx.startYaw);
        ctx.total = TAU + (extra < 0 ? extra + TAU : extra);
      },
    });
    beats.push({
      id: 'notice',
      update(ctx) {
        hold(ctx);
        ctx.drive.yaw = toDoor(ctx);
        ctx.drive.pitch = 0;
        if (ctx.t > 1.2) ctx.drive.eyeHeight = config.eyeHeight;
        return ctx.t >= config.restSeconds * 1.2;
      },
    });
    beats.push({
      id: 'approach',
      update(ctx) {
        moveToward(ctx, beyond.x, beyond.z, config.walkSpeed * 0.75);
        ctx.drive.pitch = 0;
        // The zone hands over at the wall; keep pushing until it does.
        return false;
      },
    });
    return beats;
  };
}

function corridorBeats(config) {
  return (zone) => {
    const facing = zone.facing();
    const isReturn = zone.role === 'return';
    const runFrom = isReturn
      ? zone.length - config.lightDistance
      : zone.length * config.runAfter;
    const slowFrom = zone.length - (isReturn ? 7 : config.thresholdSlow);
    const wander = (ctx, amplitude) =>
      Math.sin(ctx.t * 0.31) * Math.sin(ctx.t * 0.17 + 1.3) * amplitude * DEG;
    const glance = (ctx) => {
      const opening = zone.openingAhead(ctx.walker.progress);
      if (!opening) return 0;
      const ahead = opening.along - ctx.walker.progress;
      if (ahead > 9 || ahead < -1) return 0;
      const w = ease((9 - ahead) / 4) * ease((ahead + 1) / 3);
      return -opening.side * 38 * DEG * w;
    };
    return [
      {
        id: 'walk',
        enter(ctx) {
          ctx.drive.speed = config.walkSpeed;
          ctx.drive.eyeHeight = config.eyeHeight;
          ctx.drive.handheld = 1;
        },
        update(ctx) {
          ctx.drive.forward = 1;
          ctx.drive.strafe = 0;
          ctx.drive.yaw = facing + wander(ctx, 7) + glance(ctx);
          ctx.drive.pitch = wander(ctx, 2.5) - 1.5 * DEG;
          return ctx.walker.progress >= runFrom;
        },
      },
      {
        id: 'run',
        update(ctx) {
          ctx.drive.forward = 1;
          ctx.drive.speed =
            config.walkSpeed +
            (config.runSpeed - config.walkSpeed) * ease(ctx.t / 4);
          ctx.drive.handheld = 1.6;
          ctx.drive.yaw = facing + wander(ctx, 3) + glance(ctx) * 0.4;
          ctx.drive.pitch = -1 * DEG;
          return ctx.walker.progress >= slowFrom;
        },
      },
      {
        id: 'slow',
        enter(ctx) {
          ctx.from = ctx.drive.speed;
        },
        update(ctx) {
          ctx.drive.forward = 1;
          ctx.drive.speed =
            ctx.from + (config.walkSpeed * 0.7 - ctx.from) * ease(ctx.t / 2.5);
          ctx.drive.handheld = 1;
          ctx.drive.yaw = facing + wander(ctx, 2);
          ctx.drive.pitch = isReturn ? 0 : 4 * DEG * ease(ctx.t / 3);
          return false;
        },
      },
    ];
  };
}

function greatRoomBeats(config) {
  return (zone) => {
    const facing = zone.facing();
    const holeWorld = zone.frame.toWorld(zone.hole.x, zone.hole.z);
    const landingMid = zone.landingAngle + zone.landingSweep * 0.5;
    const rimPoint = zone.frame.toWorld(
      zone.hole.x + Math.cos(landingMid) * (zone.hole.radius + 1.6),
      zone.hole.z + Math.sin(landingMid) * (zone.hole.radius + 1.6)
    );
    const landingPoint = zone.frame.toWorld(
      zone.hole.x +
        Math.cos(landingMid) * (zone.hole.radius - config.stairWidth * 0.5),
      zone.hole.z +
        Math.sin(landingMid) * (zone.hole.radius - config.stairWidth * 0.5)
    );
    return [
      {
        id: 'threshold',
        update(ctx) {
          hold(ctx);
          const f = ctx.t / config.thresholdSeconds;
          ctx.drive.yaw = facing + Math.sin(f * Math.PI * 2) * 55 * DEG;
          ctx.drive.pitch = (10 + 22 * Math.sin(f * Math.PI)) * DEG;
          return ctx.t >= config.thresholdSeconds;
        },
      },
      {
        id: 'toRim',
        update(ctx) {
          // A walk that becomes a jog: the floor is a long way of nothing.
          const speed =
            config.walkSpeed +
            (config.runSpeed * 0.65 - config.walkSpeed) * ease((ctx.t - 3) / 6);
          const d = moveToward(ctx, holeWorld.x, holeWorld.z, speed);
          if (d < zone.hole.radius + 12)
            ctx.drive.speed = config.walkSpeed * 0.8;
          ctx.drive.pitch = -4 * DEG * ease((30 - d) / 20);
          return d <= zone.hole.radius + 1.4;
        },
      },
      {
        id: 'overEdge',
        update(ctx) {
          hold(ctx);
          ctx.drive.yaw = lookAtWorld(ctx, holeWorld.x, holeWorld.z);
          const f = ease(ctx.t / 2.5);
          ctx.drive.pitch = -62 * DEG * f + Math.sin(ctx.t * 0.9) * 3 * DEG;
          return ctx.t >= config.edgeSeconds;
        },
      },
      {
        id: 'toLanding',
        update(ctx) {
          // Round the rim, not across the hole: aim a little way ahead along
          // the circle until the landing's bearing is reached.
          const local = zone.frame.toLocal(
            ctx.walker.position.x,
            ctx.walker.position.z
          );
          const bearing = zone.bearingOf(local.x, local.z);
          const remaining = wrapAngle(landingMid - bearing);
          if (Math.abs(remaining) < 0.04) {
            const d = moveToward(ctx, rimPoint.x, rimPoint.z, config.walkSpeed);
            ctx.drive.pitch = -8 * DEG;
            return d < 0.8;
          }
          const aim = bearing + Math.max(-0.25, Math.min(0.25, remaining));
          const next = zone.frame.toWorld(
            zone.hole.x + Math.cos(aim) * (zone.hole.radius + 1.6),
            zone.hole.z + Math.sin(aim) * (zone.hole.radius + 1.6)
          );
          moveToward(ctx, next.x, next.z, config.walkSpeed);
          // Looking into the void as we go round it.
          ctx.drive.yaw +=
            wrapAngle(
              lookAtWorld(ctx, holeWorld.x, holeWorld.z) - ctx.drive.yaw
            ) * 0.45;
          ctx.drive.pitch = -20 * DEG;
          return false;
        },
      },
      {
        id: 'ontoLanding',
        update(ctx) {
          moveToward(
            ctx,
            landingPoint.x,
            landingPoint.z,
            config.walkSpeed * 0.7
          );
          ctx.drive.pitch = -14 * DEG;
          return false;
        },
      },
    ];
  };
}

function shaftBeats(config) {
  return (zone) => {
    const seed = zone.lap * 13.7;
    return [
      {
        id: 'descend',
        enter(ctx) {
          ctx.nextGlance = 6;
          ctx.glance = null;
          ctx.drive.handheld = 1.2;
        },
        update(ctx) {
          const { state } = ctx.walker;
          const tangent = zone.facing(state, ctx.walker.scratch);
          const voidYaw = zone.voidYaw(state);
          // Speed climbs over the first stretch and wanders after that.
          const ramp = ease(ctx.t / 25);
          ctx.drive.speed =
            config.walkSpeed + (config.stairSpeed - config.walkSpeed) * ramp;
          ctx.drive.forward = 1;
          ctx.drive.strafe = 0;

          if (!ctx.glance && ctx.t >= ctx.nextGlance) {
            const roll = hash01(seed + ctx.nextGlance * 0.37);
            let kind = 'wall';
            if (roll < 0.55) kind = 'edge';
            else if (roll < 0.8) kind = 'up';
            ctx.glance = {
              kind,
              start: ctx.t,
              seconds: 2.5 + roll * 2,
            };
            ctx.nextGlance =
              ctx.t + config.glanceEvery * (0.6 + hash01(seed + ctx.t) * 0.8);
          }
          let yaw = tangent;
          let pitch = -12 * DEG;
          if (ctx.glance) {
            const g = ctx.glance;
            const f =
              ease((ctx.t - g.start) / 1.2) *
              ease((g.start + g.seconds - ctx.t) / 1.2);
            if (g.kind === 'edge') {
              yaw = tangent + wrapAngle(voidYaw - tangent) * 0.85 * f;
              pitch = (-12 - 48 * f) * DEG;
              ctx.drive.speed *= 1 - 0.5 * f;
            } else if (g.kind === 'up') {
              yaw = tangent + wrapAngle(voidYaw - tangent) * 0.5 * f;
              pitch = (-12 + 52 * f) * DEG;
            } else {
              yaw = tangent - wrapAngle(voidYaw - tangent) * 0.7 * f;
              pitch = (-12 + 14 * f) * DEG;
            }
            if (ctx.t > g.start + g.seconds) ctx.glance = null;
          }
          ctx.drive.yaw = yaw + Math.sin(ctx.t * 0.23) * 3 * DEG;
          ctx.drive.pitch = pitch;
          return false;
        },
      },
    ];
  };
}

function shaftFloorBeats(config) {
  return (zone) => {
    const order = [...zone.exits].sort((a, b) => a.angle - b.angle);
    const pick =
      config.floorChoice >= 0
        ? order[config.floorChoice % order.length]
        : order[Math.floor(hash01(zone.lap * 3.3 + 0.5) * order.length)];
    const doorPoint = zone.frame.toWorld(
      ...Object.values(
        zone.exitPoint(pick, zone.wallRadius + config.spokeLength + 1.5)
      )
    );
    return [
      {
        id: 'toCentre',
        enter(ctx) {
          ctx.drive.handheld = 1;
          // Far enough in to see every doorway; the floor is wide and there
          // is nothing to cross it for.
          const local = zone.frame.toLocal(
            ctx.walker.position.x,
            ctx.walker.position.z
          );
          ctx.target = zone.frame.toWorld(
            zone.centre.x + (local.x - zone.centre.x) * 0.3,
            zone.centre.z + (local.z - zone.centre.z) * 0.3
          );
        },
        update(ctx) {
          const speed =
            config.walkSpeed +
            (config.runSpeed * 0.6 - config.walkSpeed) * ease((ctx.t - 2) / 5);
          const d = moveToward(ctx, ctx.target.x, ctx.target.z, speed);
          if (d < 8) ctx.drive.speed = config.walkSpeed * 0.8;
          ctx.drive.pitch = -2 * DEG;
          return d < 1.2;
        },
      },
      {
        id: 'evaluate',
        enter(ctx) {
          ctx.startYaw = ctx.walker.yaw;
          ctx.total = TAU;
        },
        update(ctx) {
          hold(ctx);
          // A slow full turn that lingers on each doorway as it passes.
          const f = ctx.t / config.evaluateSeconds;
          const base = ctx.startYaw + ctx.total * ease(f);
          let nearest = 0;
          let weight = 0;
          order.forEach((exit) => {
            const y = zone.exitYaw(exit);
            const d = wrapAngle(y - base);
            const w = Math.exp(-(d * d) / (2 * 0.12 * 0.12));
            if (w > weight) {
              weight = w;
              nearest = d;
            }
          });
          ctx.drive.yaw = base + nearest * weight * 0.8;
          ctx.drive.pitch = 2 * DEG;
          return ctx.t >= config.evaluateSeconds;
        },
      },
      {
        id: 'choose',
        update(ctx) {
          hold(ctx);
          ctx.drive.yaw = zone.exitYaw(pick);
          ctx.drive.pitch = 0;
          return ctx.t >= 2;
        },
      },
      {
        id: 'go',
        update(ctx) {
          const speed =
            config.walkSpeed +
            (config.runSpeed * 0.6 - config.walkSpeed) * ease((ctx.t - 2) / 5);
          const d = moveToward(ctx, doorPoint.x, doorPoint.z, speed);
          if (d < 10) ctx.drive.speed = config.walkSpeed;
          ctx.drive.pitch = 0;
          return false;
        },
      },
    ];
  };
}

export default function beatsFor(config) {
  return {
    livingRoom: livingRoomBeats(config),
    corridor: corridorBeats(config),
    greatRoom: greatRoomBeats(config),
    shaft: shaftBeats(config),
    shaftFloor: shaftFloorBeats(config),
  };
}
