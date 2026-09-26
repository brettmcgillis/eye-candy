import {
  Fn,
  If,
  Loop,
  Return,
  atomicLoad,
  atomicStore,
  float,
  hash,
  instanceIndex,
  int,
  length,
  max,
  min,
  smoothstep,
  uint,
  vec3,
  vec4,
} from 'three/tsl';

import { FORCE_SCALE } from './grid';

// lanes: x = home height, y = home depth, z = full radius, w = signed speed.
// motion: xyz = velocity, w = age.
// Resistance is applied without dt on purpose: the summed overlap already
// scales with speed * dt * contacts, so this is a drag proportional to how
// much wire the sphere is currently shouldering aside.
export function createSphereVelocity(b, u, count) {
  return Fn(() => {
    If(instanceIndex.greaterThanEqual(uint(count)), () => {
      Return();
    });
    const body = b.bodies.element(instanceIndex);
    const motion = b.motion.element(instanceIndex);
    const lane = b.lanes.element(instanceIndex);
    const base = instanceIndex.mul(uint(4));
    const read = (k) => float(atomicLoad(b.reaction.element(base.add(k))));
    const reaction = vec3(read(0), read(1), read(2)).div(FORCE_SCALE);
    [0, 1, 2, 3].forEach((k) => {
      atomicStore(b.reaction.element(base.add(k)), int(0));
    });

    const target = vec3(
      lane.w.mul(u.sphereSpeed),
      lane.x.sub(body.y).mul(u.laneStiffness),
      lane.y.sub(body.z).mul(u.laneStiffness)
    );
    const velocity = motion.xyz.toVar();
    velocity.addAssign(
      target.sub(velocity).mul(min(u.sphereDrive.mul(u.dt), 1))
    );
    velocity.addAssign(reaction.mul(u.sphereResistance));

    Loop(
      { start: uint(0), end: uint(count), type: 'uint', name: 'j' },
      ({ j }) => {
        If(j.notEqual(instanceIndex), () => {
          const other = b.bodies.element(j);
          const offset = body.xyz.sub(other.xyz);
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

    motion.assign(vec4(velocity, motion.w.add(u.dt)));
  })().compute(count);
}

export function createSpherePosition(b, u, layout, count) {
  return Fn(() => {
    If(instanceIndex.greaterThanEqual(uint(count)), () => {
      Return();
    });
    const body = b.bodies.element(instanceIndex);
    const motion = b.motion.element(instanceIndex);
    const lane = b.lanes.element(instanceIndex);
    const radius = lane.z.mul(smoothstep(0, u.growTime, motion.w));
    const p = body.xyz.add(motion.xyz.mul(u.dt)).toVar();

    const wrap = float(layout.sphereWrap);
    const exited = lane.w
      .greaterThan(0)
      .and(p.x.greaterThan(wrap))
      .or(lane.w.lessThan(0).and(p.x.lessThan(wrap.negate())));
    If(exited, () => {
      const roll = hash(float(instanceIndex).mul(7.31).add(u.phase.mul(13.7)));
      const home = roll.mul(2).sub(1).mul(u.laneRange);
      lane.x.assign(home);
      p.x.assign(p.x.negate());
      p.y.assign(home);
    });

    const low = u.zBack.add(radius);
    const high = u.zFront.sub(radius);
    const mid = u.zBack.add(u.zFront).mul(0.5);
    p.z.assign(low.lessThan(high).select(p.z.clamp(low, high), mid));
    body.assign(vec4(p, radius));
  })().compute(count);
}
