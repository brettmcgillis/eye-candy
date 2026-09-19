import { corridorVariationFor, sectionAt } from '@modules/houseOfLeaves';

import { yawAlong } from '../frames';

// A zone owns how the walker's position is represented and how a world-space
// step is clamped to what can actually be walked on. Nothing here is a mesh or
// a collider: the architecture is built from closed-form functions, so the
// ground the walker stands on is read from the same functions rather than
// raycast against a copy of them that might disagree.
//
// The corridor runs down its frame's local +X from x = 0 for `length` metres.
// Its section is a function of distance, so the clamp follows the walls as
// they drift and grow.
export default function createCorridorZone(config, options) {
  const {
    id,
    lap,
    frame,
    length,
    exitTo,
    role = 'out',
    entry = null,
    seed = 0,
  } = options;
  const profile = {
    corridorWidth: config.corridorWidth,
    corridorHeight: config.corridorHeight,
    startWidth: config.startWidth,
    startHeight: config.startHeight,
    growthRun: config.hallGrowthRun,
    length,
    reverse: role === 'return',
    seed,
    segmentLength: config.segmentLength,
    driftAmount: config.driftAmount,
    driftWavelength: config.driftWavelength,
    stepAmount: config.stepAmount,
    stepRunLength: config.stepRunLength,
    branchChance: config.branchChance,
  };
  const halfAt = (x) =>
    Math.max(0.05, sectionAt(x, profile).width * 0.5 - config.walkerRadius);

  return {
    kind: 'corridor',
    role,
    id,
    lap,
    frame,
    length,
    entry,
    profile,
    exitTo,

    // Mid-segment, not on a joint. Spawning on one puts the walker inside
    // whatever wall that joint happens to carry.
    spawn: () => ({ x: config.segmentLength * 0.5, z: 0 }),
    enter: ({ along = 0, lateral = 0 } = {}) => {
      const half = halfAt(Math.max(0, along));
      return { x: along, z: Math.max(-half, Math.min(half, lateral)) };
    },
    frameOf: () => null,

    step: (current, delta) => {
      const local = frame.deltaToLocal(delta.x, delta.z);
      const x = current.x + local.x;
      const half = halfAt(Math.max(0, x));
      return { x, z: Math.max(-half, Math.min(half, current.z + local.z)) };
    },

    place: (current, out) => {
      const world = frame.toWorld(current.x, current.z);
      return out.set(world.x, frame.y, world.z);
    },
    facing: () => yawAlong(frame),
    progress: (current) => current.x,

    exit: (current) =>
      current.x >= length ? { to: exitTo, lateral: current.z } : null,

    near: (pos, margin) => {
      const local = frame.toLocal(pos.x, pos.z);
      return (
        local.x > -margin &&
        local.x < length + margin &&
        Math.abs(local.z) < 30 + margin &&
        Math.abs(pos.y - frame.y) < margin
      );
    },

    // What the director can see coming: the next opening ahead of `x`.
    openingAhead: (x) => {
      const first = Math.floor(x / config.segmentLength);
      for (let i = first; i < first + 3; i += 1) {
        const variation = corridorVariationFor(i, profile);
        if (variation.kind !== 'plain') {
          const along = (i + 0.5) * config.segmentLength;
          if (along > x)
            return { along, side: variation.side, kind: variation.kind };
        }
      }
      return null;
    },
  };
}
