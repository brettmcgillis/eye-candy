// A zone owns how the walker's position is represented and how a world-space
// step is clamped to what can actually be walked on. Nothing here is a mesh or
// a collider: the architecture is swept from closed-form functions, so the
// ground the walker stands on is read from the same functions rather than
// raycast against a copy of them that might disagree.
//
// Every zone answers the same questions — where do I start, where does a step
// put me, where am I in the world, and have I left — so the walker never knows
// which one it is in.
//
// The corridor is placed rather than fixed at the origin, because the way back
// is the same zone laid down a spoke at the bottom of the shaft, pointing
// wherever that spoke happens to point.
export default function createCorridorZone(config, options = {}) {
  const {
    id = 'corridor',
    origin = { x: 0, y: 0, z: 0 },
    heading = 0,
    length = config.hallLength,
    exitTo = 'greatRoom',
  } = options;

  const halfWidth = config.corridorWidth * 0.5 - config.walkerRadius;

  // Placement is live rather than baked, because the way back is this same
  // zone laid down whichever spoke the walker chose — and which spoke that is
  // is not known until they walk through it.
  const placement = {
    origin: { ...origin },
    heading,
    cos: Math.cos(heading),
    sin: Math.sin(heading),
  };
  const placeAt = (at, angle) => {
    placement.origin = { ...at };
    placement.heading = angle;
    placement.cos = Math.cos(angle);
    placement.sin = Math.sin(angle);
  };

  // Local +X runs down the corridor; the heading turns that into world space.
  const toWorld = (x, z) => ({
    x: placement.origin.x + x * placement.cos - z * placement.sin,
    z: placement.origin.z + x * placement.sin + z * placement.cos,
  });
  // A step is a direction, not a place, so it takes the rotation alone.
  const deltaToLocal = (dx, dz) => ({
    x: dx * placement.cos + dz * placement.sin,
    z: -dx * placement.sin + dz * placement.cos,
  });

  return {
    id,
    placement,
    get origin() {
      return placement.origin;
    },
    get heading() {
      return placement.heading;
    },
    // Mid-segment, not on a joint. Spawning on one puts the walker inside
    // whatever bulkhead that joint happens to carry.
    spawn: () => ({ x: config.segmentLength * 0.5, z: 0 }),

    // Entering from a spoke at the bottom of the shaft: the corridor is laid
    // down *that* spoke, not whichever one happened to be first, and the
    // walker keeps the cross-track offset they came through the doorway with.
    enter: ({ along = 0, lateral = 0, door, centre } = {}) => {
      if (door && centre) {
        placeAt(
          {
            x: centre.x + Math.cos(door.angle) * (centre.radius ?? 0),
            y: 0,
            z: centre.z + Math.sin(door.angle) * (centre.radius ?? 0),
          },
          door.angle
        );
      }
      return {
        x: along,
        z: Math.max(-halfWidth, Math.min(halfWidth, lateral)),
      };
    },
    frame: () => null,

    // Straight down its own axis, forever. Nothing wraps and nothing recycles
    // the walker's own coordinate — the corridor is genuinely unbounded and
    // the rebase in the walker is what keeps the numbers small.
    step: (state, delta) => {
      const local = deltaToLocal(delta.x, delta.z);
      return {
        x: state.x + local.x,
        z: Math.max(-halfWidth, Math.min(halfWidth, state.z + local.z)),
      };
    },

    place: (state, out) => {
      const world = toWorld(state.x, state.z);
      return out.set(world.x, placement.origin.y ?? 0, world.z);
    },
    height: () => placement.origin.y ?? 0,
    // Yaw 0 looks down -Z, and the corridor is swept along its local +X.
    // Without this the walk starts side-on and W puts the walker straight into
    // the wall, where the clamp holds it and progress never advances.
    facing: () => Math.atan2(-placement.cos, -placement.sin),
    progress: (state) => state.x,

    // Endless in feel, not in fact: it releases into whatever it leads to once
    // the walk has covered its length.
    exit: (state) =>
      exitTo && state.x >= length ? { to: exitTo, lateral: state.z } : null,
  };
}
