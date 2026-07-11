import createSpatialGrid from './createSpatialGrid';

// Every constant below is Floids' own value from
// ~/dev/examples/Floids/src/world/Agents.js, not an independently invented
// number. WORLD_SCALE exists only because this scene's camera/geometry
// conventions sit around habitat-radius-8 rather than Floids' own
// habitat-radius-0.8 unit sphere — it's the ONE place that fact lives, and
// every spatial constant derives from it instead of each carrying its own
// unexplained fudge factor.
//
// Which constants scale and which don't (dimensional analysis, not a
// guess): we want the same animation, just WORLD_SCALE times bigger in
// space, evolving over the same real seconds — not WORLD_SCALE times
// slower or faster. That means:
//  - radii and speeds ([L] or [L/T])                      -> x WORLD_SCALE
//  - force constants multiplying a RAW position/velocity
//    delta ([1/T] or [1/T^2]) — the delta itself already
//    carries an implicit x WORLD_SCALE, so the constant
//    doesn't need to                                        -> unchanged
//  - force constants multiplying a NORMALIZED/unit-length
//    direction (no implicit scaling from the input)          -> x WORLD_SCALE
const WORLD_SCALE = 10; // this port's HABITAT_RADIUS (8) / Floids' (0.8)

const ALIGN_FACTOR = 0.05; // Agents.js ALIGN_FACTOR — velocity-delta input, unchanged
const COHERE_FACTOR = 5; // Agents.js COHERE_FACTOR — position-delta input, unchanged
const AVOID_FACTOR = 30; // Agents.js AVOID_FACTOR — position-delta input, unchanged
const FLEE_FACTOR = 3 * WORLD_SCALE; // Agents.js FLEE_FACTOR — normalized-direction input
const HABITAT_FACTOR = 0.1; // Agents.js HABITAT_FACTOR — position-delta input, unchanged
const CONFUSION_FACTOR = 0.2; // Agents.js CONFUSION_FACTOR — dimensionless (fraction of fireCycle)
const NUDGE_FACTOR = 0.01; // Agents.js NUDGE_FACTOR — dimensionless (fraction of fireCycle)
const NUDGE_LIMIT = 3; // Agents.js NUDGE_LIMIT — a count, not a physical quantity
const TAU_SPEED = 0.01; // Agents.js TAU_SPEED — a time constant, not rescaled (see below)
// Agents.js doesn't expose these as GUI controls (they're fixed), so ours
// aren't either: FLEE_RADIUS is a property of the flock's own sensing
// range, not of the hunter's rendered size — the original port conflated
// the two by deriving fleeRadius from the `hunterRadius` visual-size
// control, which is why the flee trigger distance changed whenever you
// resized the hunter sphere for looks.
const FLEE_RADIUS = 0.3 * WORLD_SCALE; // Agents.js FLEE_RADIUS
const GRID_BOUNDS_MARGIN = 4;
const HABITAT_Y = 3.5;
const MAX_HUNTERS = 3;
const MAX_SPEED_MULTIPLE = 6;
// Agents.js HABITAT_RADIUS (0.8) — the flock's own habitat, at baseline
// (single-window) scale. hooks/useSharedSwarm.js grows this live with
// window count; this is the un-grown baseline, exported so that scaling
// (and the hunter's own, larger habitat below) has one source of truth
// instead of a second, independently-typed "8".
const BASE_HABITAT_RADIUS = 0.8 * WORLD_SCALE;
// Hunter.js HABITAT_RADIUS (1.0) — the hunter roams a habitat 1.25x the
// flock's own (Hunter.js uses 1.0 vs Agents.js's 0.8), not some unrelated
// invented ratio.
const HUNTER_HABITAT_RATIO = 1.0 / 0.8;

// fireflySpeed/neighborRadius/separationRadius controls are direct
// pass-throughs into these units (no hidden conversion) — see
// getFireflyControls.js/getFlockingControls.js for their ranges/defaults,
// which mirror Floids' own dat.gui ranges where Floids exposes the
// equivalent control (fireflySpeed <-> Agents.js's DESIRED_SPEED slider,
// 0-0.4) or its literal fixed constant where Floids doesn't expose one
// (neighborRadius/separationRadius <-> Agents.js's un-exposed
// VISIBLE_RADIUS/PROTECTED_RADIUS).
function getControls(config) {
  return {
    desiredSpeed: config.fireflySpeed * WORLD_SCALE,
    fireCycle: config.fireCycle,
    fleeRadius: FLEE_RADIUS,
    protectedRadius: config.separationRadius,
    visibleRadius: config.neighborRadius,
  };
}

/* eslint-disable no-param-reassign */
function seedSphere(
  positions,
  velocities,
  clocks,
  index,
  controls,
  habitatRadius
) {
  const offset = index * 3;
  const radius = Math.cbrt(Math.random()) * habitatRadius * 0.9;
  const theta = Math.random() * Math.PI * 2;
  const y = Math.random() * 2 - 1;
  const planar = Math.sqrt(1 - y * y);
  positions[offset] = radius * planar * Math.cos(theta);
  positions[offset + 1] = radius * y + HABITAT_Y;
  positions[offset + 2] = radius * planar * Math.sin(theta);
  velocities[offset] = (Math.random() * 2 - 1) * (controls.desiredSpeed / 5);
  velocities[offset + 1] =
    (Math.random() * 2 - 1) * (controls.desiredSpeed / 5);
  velocities[offset + 2] =
    (Math.random() * 2 - 1) * (controls.desiredSpeed / 5);
  clocks[index] = Math.random() * controls.fireCycle;
}

// Faithful CPU port of Floids' Agents.tick(): force accumulation reads stable
// position/velocity arrays, then a second pass integrates all agents
// together. Neighbor search uses a spatial grid (createSpatialGrid.js) —
// Floids' own UnitGrid, adapted for zero per-frame allocation — instead of
// the brute-force O(n^2) scan the previous port used, which is what made
// this fall over at 200+ agents.
//
// `habitatRadius` is a live parameter, not a fixed constant: in multi-tab
// mode (hooks/useSharedSwarm.js) the habitat grows as more windows join, so
// the constraint radius has to be able to change without recreating the
// whole simulation (which would reseed every agent's position).
export default function createFloidsSimulation(
  count,
  config,
  initialHabitatRadius
) {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const nextVelocities = new Float32Array(count * 3);
  const clocks = new Float32Array(count);
  const nudges = new Uint8Array(count);
  const controls = getControls(config);
  const grid = createSpatialGrid(count);

  for (let index = 0; index < count; index += 1) {
    seedSphere(
      positions,
      velocities,
      clocks,
      index,
      controls,
      initialHabitatRadius
    );
  }

  // Reused every frame/agent instead of allocating a fresh accumulator per
  // neighbor query — `visitNeighbor` below is a single stable closure over
  // this object plus the typed arrays above.
  const scan = {
    alignX: 0,
    alignY: 0,
    alignZ: 0,
    avoidX: 0,
    avoidY: 0,
    avoidZ: 0,
    coherX: 0,
    coherY: 0,
    coherZ: 0,
    dt: 0,
    index: 0,
    neighbors: 0,
    protectedRadiusSq: 0,
    px: 0,
    py: 0,
    pz: 0,
  };

  function visitNeighbor(other, radiusSq) {
    const otherOffset = other * 3;
    const dx = positions[otherOffset] - scan.px;
    const dy = positions[otherOffset + 1] - scan.py;
    const dz = positions[otherOffset + 2] - scan.pz;
    const distanceSq = dx * dx + dy * dy + dz * dz;
    if (distanceSq >= radiusSq) return;

    scan.neighbors += 1;
    scan.alignX += velocities[otherOffset];
    scan.alignY += velocities[otherOffset + 1];
    scan.alignZ += velocities[otherOffset + 2];
    scan.coherX += positions[otherOffset];
    scan.coherY += positions[otherOffset + 1];
    scan.coherZ += positions[otherOffset + 2];
    if (distanceSq < scan.protectedRadiusSq) {
      scan.avoidX += dx;
      scan.avoidY += dy;
      scan.avoidZ += dz;
    }
    if (clocks[other] < scan.dt) {
      nudges[scan.index] = Math.min(NUDGE_LIMIT, nudges[scan.index] + 1);
    }
  }

  // hunterPositions: flat Float32Array(MAX_HUNTERS * 3), only the first
  // `hunterCount` entries are active. Flee-force sums repulsion from every
  // active hunter within range, same treatment as summing neighbor forces.
  function step(
    delta,
    nextConfig,
    hunterPositions,
    hunterCount,
    cursor,
    habitatRadius
  ) {
    const dt = Math.min(delta, 1 / 30);
    Object.assign(controls, getControls(nextConfig));
    const protectedRadiusSq = controls.protectedRadius ** 2;
    const fleeRadiusSq = controls.fleeRadius ** 2;
    const habitatRadiusSq = habitatRadius ** 2;

    grid.build(
      positions,
      count,
      controls.visibleRadius,
      habitatRadius + GRID_BOUNDS_MARGIN
    );

    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      const px = positions[offset];
      const py = positions[offset + 1];
      const pz = positions[offset + 2];

      clocks[index] += dt;
      if (clocks[index] >= controls.fireCycle) {
        clocks[index] %= controls.fireCycle;
      }

      scan.px = px;
      scan.py = py;
      scan.pz = pz;
      scan.dt = dt;
      scan.index = index;
      scan.protectedRadiusSq = protectedRadiusSq;
      scan.neighbors = 0;
      scan.alignX = 0;
      scan.alignY = 0;
      scan.alignZ = 0;
      scan.coherX = 0;
      scan.coherY = 0;
      scan.coherZ = 0;
      scan.avoidX = 0;
      scan.avoidY = 0;
      scan.avoidZ = 0;
      grid.forEachNeighbor(
        px,
        py,
        pz,
        controls.visibleRadius,
        index,
        visitNeighbor
      );

      let forceX = 0;
      let forceY = 0;
      let forceZ = 0;
      if (scan.neighbors) {
        const { neighbors } = scan;
        forceX += (scan.alignX / neighbors - velocities[offset]) * ALIGN_FACTOR;
        forceY +=
          (scan.alignY / neighbors - velocities[offset + 1]) * ALIGN_FACTOR;
        forceZ +=
          (scan.alignZ / neighbors - velocities[offset + 2]) * ALIGN_FACTOR;
        forceX += (scan.coherX / neighbors - px) * COHERE_FACTOR;
        forceY += (scan.coherY / neighbors - py) * COHERE_FACTOR;
        forceZ += (scan.coherZ / neighbors - pz) * COHERE_FACTOR;
        forceX -= scan.avoidX * AVOID_FACTOR;
        forceY -= scan.avoidY * AVOID_FACTOR;
        forceZ -= scan.avoidZ * AVOID_FACTOR;
      }

      for (let h = 0; h < hunterCount; h += 1) {
        const hOffset = h * 3;
        const hunterX = px - hunterPositions[hOffset];
        const hunterY = py - hunterPositions[hOffset + 1];
        const hunterZ = pz - hunterPositions[hOffset + 2];
        const hunterDistanceSq =
          hunterX * hunterX + hunterY * hunterY + hunterZ * hunterZ;
        if (hunterDistanceSq < fleeRadiusSq && hunterDistanceSq > 0.000001) {
          const inverseDistance = 1 / Math.sqrt(hunterDistanceSq);
          forceX += hunterX * inverseDistance * FLEE_FACTOR;
          forceY += hunterY * inverseDistance * FLEE_FACTOR;
          forceZ += hunterZ * inverseDistance * FLEE_FACTOR;
          clocks[index] = Math.max(
            0,
            clocks[index] -
              controls.fireCycle * CONFUSION_FACTOR * Math.random()
          );
        }
      }

      const habitatX = px;
      const habitatY = py - HABITAT_Y;
      const habitatZ = pz;
      if (
        habitatX * habitatX + habitatY * habitatY + habitatZ * habitatZ >
        habitatRadiusSq
      ) {
        forceX -= habitatX * HABITAT_FACTOR;
        forceY -= habitatY * HABITAT_FACTOR;
        forceZ -= habitatZ * HABITAT_FACTOR;
      }

      if (cursor.mode !== 'off') {
        const cursorX = cursor.position.x - px;
        const cursorY = cursor.position.y - py;
        const cursorZ = cursor.position.z - pz;
        const cursorDistance = Math.hypot(cursorX, cursorY, cursorZ);
        if (cursorDistance < cursor.radius && cursorDistance > 0.000001) {
          const sign = cursor.mode === 'attract' ? 1 : -1;
          const strength = sign * (1 - cursorDistance / cursor.radius) * 3;
          forceX += (cursorX / cursorDistance) * strength;
          forceY += (cursorY / cursorDistance) * strength;
          forceZ += (cursorZ / cursorDistance) * strength;
        }
      }

      // Speed restoration, as a force added into the same accumulator as
      // everything else (matching Floids' own restoreVelocity()), NOT a
      // post-hoc correction applied to the already-integrated velocity.
      // The post-hoc form (restore = (desiredSpeed - speed) * (dt /
      // TAU_SPEED), applied directly to vx/vy/vz) is an explicit-Euler step
      // on an exponential relaxation with a per-frame gain of dt/TAU_SPEED
      // — stable only while that ratio stays under ~2. With TAU_SPEED =
      // 0.01 and dt clamped up to 1/30 (~0.033), the ratio reaches ~3.3
      // during any stutter (dt pinned at its clamp ceiling), which
      // overshoots and grows every frame instead of damping — an
      // exponential blowup that sends every agent flying off to
      // effectively-infinite positions within a few frames. Folding it
      // into the shared force→velocity integration (one dt factor from
      // being a force, matching Floids exactly) removes that instability.
      const speed = Math.hypot(
        velocities[offset],
        velocities[offset + 1],
        velocities[offset + 2]
      );
      if (speed > 0.000001) {
        const restoreScale = ((controls.desiredSpeed - speed) * dt) / TAU_SPEED;
        forceX += velocities[offset] * restoreScale;
        forceY += velocities[offset + 1] * restoreScale;
        forceZ += velocities[offset + 2] * restoreScale;
      }

      let nvx = velocities[offset] + forceX * dt;
      let nvy = velocities[offset + 1] + forceY * dt;
      let nvz = velocities[offset + 2] + forceZ * dt;
      // Hard backstop, independent of the restoration fix above: no
      // combination of forces (many simultaneous flee interactions, a
      // large delta, future tuning) should be able to send an agent to
      // effectively-infinite speed in one step.
      const nextSpeed = Math.hypot(nvx, nvy, nvz);
      const maxSpeed = controls.desiredSpeed * MAX_SPEED_MULTIPLE;
      if (nextSpeed > maxSpeed) {
        const clampScale = maxSpeed / nextSpeed;
        nvx *= clampScale;
        nvy *= clampScale;
        nvz *= clampScale;
      }
      nextVelocities[offset] = nvx;
      nextVelocities[offset + 1] = nvy;
      nextVelocities[offset + 2] = nvz;
    }

    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      const clockPhase =
        (Math.PI * 2 * (controls.fireCycle - clocks[index])) /
        controls.fireCycle;
      clocks[index] += Math.sin(clockPhase) * nudges[index] * NUDGE_FACTOR;
      nudges[index] = 0;
      velocities[offset] = nextVelocities[offset];
      velocities[offset + 1] = nextVelocities[offset + 1];
      velocities[offset + 2] = nextVelocities[offset + 2];
      positions[offset] += velocities[offset] * dt;
      positions[offset + 1] += velocities[offset + 1] * dt;
      positions[offset + 2] += velocities[offset + 2] * dt;
    }
  }

  return { clocks, positions, step, velocities };
}

export {
  BASE_HABITAT_RADIUS,
  HABITAT_Y,
  HUNTER_HABITAT_RATIO,
  MAX_HUNTERS,
  WORLD_SCALE,
};
