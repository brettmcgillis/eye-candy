/* eslint-disable no-param-reassign */
import { If, uniform, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';

export const MAX_PHYSICAL_ATTRACTORS = 3;

// Slow precession axis for the "animate" toggle — rotating each attractor's
// spin axis around world-Y over time (the todo's "slowly rotating the
// attractor on a single axis induced beautiful changes" note).
const PRECESSION_AXIS = new THREE.Vector3(0, 1, 0);
const workingAxis = new THREE.Vector3();

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
// precession on top without mutating the ref's authored base values.
export function syncPhysicalAttractors(slots, attractorsRef, config, elapsed) {
  const list = attractorsRef.current || [];
  const angle = config.animateAttractors ? elapsed * config.animateSpeed : 0;

  slots.forEach((slot, i) => {
    const attr = list[i];
    if (!attr) {
      slot.sign.value = 0;
      return;
    }

    slot.position.value.set(...attr.position);

    workingAxis.set(...(attr.direction || [0, 1, 0])).normalize();
    if (angle !== 0) workingAxis.applyAxisAngle(PRECESSION_AXIS, angle);
    slot.axis.value.copy(workingAxis);

    slot.sign.value = attr.type === 'repeller' ? -1 : 1;
  });
}

// Physical-attractors mode physics: gravity + spin force from each active
// attractor accumulates into a persisted velocity (real inertia, unlike
// flow mode), ported from three.js's webgpu_tsl_compute_attractors_particles
// example — `sign` flips both gravity and spin for repellers, matching how
// ParticleLab's CPU port of the same example handles its `type` field. Pair
// with extraUniforms `{ attractorStrength, spinStrength, maxSpeed, damping }`.
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

    // `speed` only scales the position step, not this velocity
    // accumulation — velocity is persisted frame-to-frame here (unlike flow
    // mode, which recomputes it fresh from position every frame), so
    // scaling both steps by `speed` would compound into speed² of visible
    // motion instead of speed. That's what made a "Speed" tuned low for
    // flow mode look frozen after switching to physical mode.
    velocity.addAssign(force.mul(uniforms.frameDelta));

    If(velocity.length().greaterThan(uniforms.maxSpeed), () => {
      velocity.assign(velocity.normalize().mul(uniforms.maxSpeed));
    });
    velocity.mulAssign(uniforms.damping.oneMinus());

    position.addAssign(velocity.mul(uniforms.frameDelta).mul(uniforms.speed));
    velocityBuf.assign(velocity);
  };
}
