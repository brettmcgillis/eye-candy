import {
  Fn,
  If,
  Loop,
  Return,
  atomicLoad,
  atomicStore,
  float,
  instanceIndex,
  int,
  length,
  max,
  min,
  mx_noise_vec3, // eslint-disable-line camelcase
  uint,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

import { FORCE_SCALE } from './grid';

// Cylinders stand through the whole cavity depth, so they live in the panel
// plane: every contact, with wires or each other, is measured in xy only.
// lanes: xy = home, z = radius, w = wander seed. motion: xy = velocity.
// Each cylinder only wanders a little around its home: one that travels
// leaves a wake the pinned wires have no slack to refill.
// Resistance is applied without dt on purpose: the summed overlap already
// scales with speed * dt * contacts, so this is a drag proportional to how
// much wire the cylinder is currently shouldering aside.
export function createCylinderVelocity(b, u, count) {
  return Fn(() => {
    If(instanceIndex.greaterThanEqual(uint(count)), () => {
      Return();
    });
    const body = b.bodies.element(instanceIndex);
    const motion = b.motion.element(instanceIndex);
    const lane = b.lanes.element(instanceIndex);
    const base = instanceIndex.mul(uint(4));
    const read = (k) => float(atomicLoad(b.reaction.element(base.add(k))));
    const reaction = vec2(read(0), read(1)).div(FORCE_SCALE);
    [0, 1, 2, 3].forEach((k) => {
      atomicStore(b.reaction.element(base.add(k)), int(0));
    });

    const wander = mx_noise_vec3(
      vec3(lane.w, lane.w.mul(1.37).add(11), u.phase.mul(u.cylinderWanderSpeed))
    ).xy.mul(u.cylinderWander);
    const target = lane.xy.add(wander).sub(body.xy).mul(u.cylinderDrive);
    const velocity = motion.xy.toVar();
    velocity.addAssign(
      target.sub(velocity).mul(min(u.cylinderDrive.mul(u.dt), 1))
    );
    velocity.addAssign(reaction.mul(u.cylinderResistance));

    Loop(
      { start: uint(0), end: uint(count), type: 'uint', name: 'j' },
      ({ j }) => {
        If(j.notEqual(instanceIndex), () => {
          const other = b.bodies.element(j);
          const offset = body.xy.sub(other.xy);
          const distance = max(length(offset), float(1e-4));
          const reach = body.w.add(other.w);
          If(distance.lessThan(reach), () => {
            velocity.addAssign(
              offset.div(distance).mul(reach.sub(distance).div(u.dt).mul(0.25))
            );
          });
        });
      }
    );

    motion.assign(vec4(velocity, 0, 0));
  })().compute(count);
}

export function createCylinderPosition(b, u, count) {
  return Fn(() => {
    If(instanceIndex.greaterThanEqual(uint(count)), () => {
      Return();
    });
    const body = b.bodies.element(instanceIndex);
    const motion = b.motion.element(instanceIndex);
    const p = body.xy.add(motion.xy.mul(u.dt));
    body.assign(vec4(p, u.zBack.add(u.zFront).mul(0.5), body.w));
  })().compute(count);
}
