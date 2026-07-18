/* eslint-disable no-param-reassign */
import { If, hash, instanceIndex, uint, uniform, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';

// Soft-containment spring constant (force per unit of radial overshoot
// beyond containmentRadius) — not user-exposed, just strong enough to turn
// runaway drift around within a second or two without visibly overpowering
// the attractors' own pull near the boundary.
const CONTAINMENT_STRENGTH = 2;

export const MAX_PHYSICAL_ATTRACTORS = 3;

// Slow precession axes for the "animate" toggle — rotating each attractor's
// spin axis over time (the todo's "slowly rotating the attractor on a
// single axis induced beautiful changes" note, which meant precessing
// around X/Z, not Y). One distinct, X/Z-leaning axis per slot rather than a
// single shared axis: PhysicalAttractorMarkers' DEFAULT_SLOTS gives two of
// the three attractors a `direction` of exactly [0, 1, 0] — a world-Y
// precession axis would be a no-op on those (precessing a vector around
// itself never changes it), leaving them frozen while only the third
// attractor actually animated. Particles caught by the two frozen
// attractors then settle into a static equilibrium ring (gravity + spin +
// damping's natural limit cycle), which reads as the whole swarm decaying
// into one static torus. Distinct X/Z-leaning axes keep all three
// attractors continuously reshaping instead.
const PRECESSION_AXES = [
  new THREE.Vector3(1, 0.15, 0.1).normalize(),
  new THREE.Vector3(0.1, 0.15, 1).normalize(),
  new THREE.Vector3(-0.7, 0.2, 0.7).normalize(),
];

function createSlot() {
  return {
    axis: uniform(new THREE.Vector3(0, 1, 0)),
    position: uniform(new THREE.Vector3()),
    // 0 = inactive (fewer than MAX_PHYSICAL_ATTRACTORS live), 1 = attractor,
    // -1 = repeller.
    sign: uniform(0),
  };
}

// Fixed 3-slot unroll instead of a uniformArray + GPU Loop, so every
// per-attractor value is a plain scalar/Vector3 uniform — the only uniform
// mutation pattern already proven safe elsewhere in this codebase (a
// uniformArray of Vector3s is proven too, per the three.js reference
// example, but a uniformArray of plain scalars isn't exercised anywhere
// here, and `sign` needs exactly that). Inactive slots contribute nothing.
export function createPhysicalAttractorState() {
  return Array.from({ length: MAX_PHYSICAL_ATTRACTORS }, createSlot);
}

// Reads position/direction from the live attractors array (dragged via the
// elements/attractors/Attractors marker overlay — see
// components/PhysicalAttractorMarkers.jsx), applying the animate-toggle's
// precession on top without mutating the ref's authored base values. Shared
// by syncPhysicalAttractors (GPU uniform sync, below) and FieldLines' CPU
// force sampling (components/FieldLines.jsx) so both see the exact same
// live positions/axes/signs — field lines would otherwise trace a subtly
// different (unprecessed, or independently-precessed) field than what the
// swarm is actually feeling.
export function computeLiveAttractors(attractorsRef, config, elapsed) {
  const list = attractorsRef.current || [];
  const angle = config.animateAttractors ? elapsed * config.animateSpeed : 0;

  return list.slice(0, MAX_PHYSICAL_ATTRACTORS).map((attr, i) => {
    const axis = new THREE.Vector3(
      ...(attr.direction || [0, 1, 0])
    ).normalize();
    if (angle !== 0) {
      axis.applyAxisAngle(PRECESSION_AXES[i % PRECESSION_AXES.length], angle);
    }
    return {
      position: new THREE.Vector3(...attr.position),
      axis,
      sign: attr.type === 'repeller' ? -1 : 1,
    };
  });
}

export function syncPhysicalAttractors(slots, attractorsRef, config, elapsed) {
  const live = computeLiveAttractors(attractorsRef, config, elapsed);

  slots.forEach((slot, i) => {
    const attr = live[i];
    if (!attr) {
      slot.sign.value = 0;
      return;
    }

    slot.position.value.copy(attr.position);
    slot.axis.value.copy(attr.axis);
    slot.sign.value = attr.sign;
  });
}

const FORCE_CLAMP = 8;

// Plain-JS mirror of createPhysicalStep's gravity+spin force (below) — same
// role as attractorFields' deriveJS for strange attractors, letting
// FieldLines trace the shape of the physical-attractors field with a
// CPU-stepped walker. Takes computeLiveAttractors' output rather than raw
// attractorsRef so it sees the same precessed axes the swarm feels.
// Excludes damping/containment (those are per-particle inertia concerns,
// not part of the field's shape) and clamps its result — unlike a strange
// attractor's field, this one has a genuine 1/distance² singularity at each
// attractor's core, and its typical magnitude is much larger than a strange
// attractor's derivative (spin dominates near the core), so an unclamped
// walker would leap around rather than trace a smooth line.
export function derivePhysicalForceJS(
  position,
  liveAttractors,
  attractorStrength,
  spinStrength
) {
  const force = new THREE.Vector3();

  liveAttractors.forEach(({ position: attrPosition, axis, sign }) => {
    const toAttractor = new THREE.Vector3().subVectors(attrPosition, position);
    const distance = Math.max(toAttractor.length(), 0.15);
    const strength = (attractorStrength / (distance * distance)) * sign;
    const direction = toAttractor.clone().divideScalar(distance);

    force.addScaledVector(direction, strength);
    const spin = axis
      .clone()
      .multiplyScalar(strength * spinStrength)
      .cross(toAttractor);
    force.add(spin);
  });

  if (force.length() > FORCE_CLAMP) force.setLength(FORCE_CLAMP);
  return [force.x, force.y, force.z];
}

// Physical-attractors mode physics: gravity + spin force from each active
// attractor accumulates into a persisted velocity (real inertia, unlike
// flow mode), ported from three.js's webgpu_tsl_compute_attractors_particles
// example — `sign` flips both gravity and spin for repellers, matching how
// ParticleLab's CPU port of the same example handles its `type` field. Pair
// with extraUniforms `{ attractorStrength, spinStrength, maxSpeed, damping,
// containmentRadius }`. Position integrates straight off velocity (no
// `speed` multiplier, unlike flow mode) — `speed` is a flow-mode-only
// concept (there, position *is* the field sample scaled by speed, with no
// persisted velocity); stacking it here on top of already-persisted
// velocity was a second, physics-disconnected damper that made the swarm
// read as stuck no matter how `damping`/`maxSpeed` were tuned.
//
// Containment is a soft inward spring past `containmentRadius`, not a hard
// box-wrap (unlike the reference/ParticleLab) — a `mod()` position wrap is
// an instant teleport, invisible on the reference's tiny additive point
// sprites but an obvious pop on an actual oriented leaf/petal mesh. The
// spring curves stray particles back continuously instead.
export function createPhysicalStep(slots) {
  return ({ position, uniforms, velocity: velocityBuf }) => {
    const velocity = velocityBuf.toVar();
    const force = vec3(0).toVar();

    slots.forEach((slot) => {
      const toAttractor = slot.position.sub(position);
      const distance = toAttractor.length().max(0.15);
      const direction = toAttractor.div(distance);
      const strength = uniforms.attractorStrength
        .div(distance.pow(2))
        .mul(slot.sign);

      force.addAssign(direction.mul(strength));
      force.addAssign(
        slot.axis.mul(strength).mul(uniforms.spinStrength).cross(toAttractor)
      );
    });

    const noisePhase = hash(instanceIndex.add(uint(811))).mul(6.28318);
    const noiseTime = uniforms.frameTime.mul(0.7).add(noisePhase);
    const curl = vec3(
      position.y.mul(1.7).add(position.z.mul(0.6)).add(noiseTime).sin(),
      position.z
        .mul(1.3)
        .add(position.x.mul(0.8))
        .add(noiseTime.mul(1.17))
        .cos(),
      position.x
        .mul(1.5)
        .add(position.y.mul(0.9))
        .sub(noiseTime.mul(0.73))
        .sin()
    ).toVar();
    force.addAssign(curl.mul(uniforms.turbulenceStrength));

    const distanceFromCenter = position.length().max(0.0001);
    const overshoot = distanceFromCenter.sub(uniforms.containmentRadius).max(0);
    const pullDirection = position.div(distanceFromCenter).negate();
    const boundaryAxis = vec3(0.31, 1, 0.57).normalize();
    const boundaryTurn = boundaryAxis.cross(position).toVar();
    const boundaryTurnLength = boundaryTurn.length().max(0.0001);
    force.addAssign(pullDirection.mul(overshoot).mul(CONTAINMENT_STRENGTH));
    force.addAssign(
      boundaryTurn
        .div(boundaryTurnLength)
        .mul(overshoot)
        .mul(uniforms.boundaryTwist)
    );

    velocity.addAssign(force.mul(uniforms.frameDelta));

    If(velocity.length().greaterThan(uniforms.maxSpeed), () => {
      velocity.assign(velocity.normalize().mul(uniforms.maxSpeed));
    });
    velocity.mulAssign(uniforms.damping.oneMinus());
    const curlLength = curl.length().max(0.0001);
    const kickDirection = curl.div(curlLength);
    const speedDeficit = uniforms.energyFloor.sub(velocity.length()).max(0);
    velocity.addAssign(kickDirection.mul(speedDeficit).mul(0.25));
    If(velocity.length().greaterThan(uniforms.maxSpeed), () => {
      velocity.assign(velocity.normalize().mul(uniforms.maxSpeed));
    });

    position.addAssign(velocity.mul(uniforms.frameDelta));
    velocityBuf.assign(velocity);
  };
}
