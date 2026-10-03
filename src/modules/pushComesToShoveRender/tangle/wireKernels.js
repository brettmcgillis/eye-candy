import {
  Fn,
  If,
  Loop,
  Return,
  atomicAdd,
  atomicStore,
  float,
  instanceIndex,
  int,
  length,
  max,
  min,
  mx_noise_vec3, // eslint-disable-line camelcase
  uint,
  vec3,
} from 'three/tsl';

import { FORCE_SCALE, cellIdOf } from './grid';

export function wireAddress(pointsPerWire) {
  const wire = instanceIndex.div(uint(pointsPerWire));
  const t = instanceIndex.sub(wire.mul(uint(pointsPerWire)));
  const pinned = t.equal(uint(0)).or(t.equal(uint(pointsPerWire - 1)));
  return { pinned, t, wire };
}

// Pinned ends wander in the plane too: a wire whose ends never move settles
// into the same slot however much its middle writhes.
function anchorFor({ b, u, layout, wire, t }) {
  const a = b.anchors.element(wire);
  const top = t.equal(uint(0)).not();
  const base = top.select(
    vec3(a.x, layout.fieldHalfHeight, a.y),
    vec3(a.z, -layout.fieldHalfHeight, a.w)
  );
  const drift = mx_noise_vec3(
    base.mul(0.35).add(vec3(0, 0, u.phase.mul(u.anchorSpeed)))
  ).mul(u.anchorDrift);
  const z = base.z
    .add(drift.z)
    .clamp(u.zBack.add(u.collideRadius), u.zFront.sub(u.collideRadius));
  return vec3(base.x.add(drift.x), base.y, z);
}

export function createIntegrate(b, u, layout) {
  return Fn(() => {
    If(instanceIndex.greaterThanEqual(uint(layout.pointCount)), () => {
      Return();
    });
    const { pinned, t, wire } = wireAddress(layout.pointsPerWire);
    const p = b.pos.element(instanceIndex);
    const prev = b.prev.element(instanceIndex);

    If(pinned, () => {
      const anchor = anchorFor({ b, layout, t, u, wire });
      p.xyz.assign(anchor);
      prev.xyz.assign(anchor);
      Return();
    });

    const here = p.xyz.toVar();
    const velocity = here.sub(prev.xyz).mul(u.damping).toVar();
    const speed = length(velocity);
    If(speed.greaterThan(u.maxStep), () => {
      velocity.mulAssign(u.maxStep.div(speed));
    });
    const flow = mx_noise_vec3(
      here
        .mul(u.writheScale)
        .add(vec3(float(wire).mul(0.013), 0, u.phase.mul(u.writheSpeed)))
    );
    const accel = flow.mul(u.writheStrength);

    prev.xyz.assign(here);
    p.xyz.assign(here.add(velocity).add(accel.mul(u.dt.mul(u.dt))));
  })().compute(layout.pointCount);
}

export function createClearGrid(b, layout) {
  return Fn(() => {
    If(instanceIndex.greaterThanEqual(uint(layout.cellCount)), () => {
      Return();
    });
    atomicStore(b.cellCount.element(instanceIndex), uint(0));
  })().compute(layout.cellCount);
}

export function createInsert(b, u, layout) {
  return Fn(() => {
    If(instanceIndex.greaterThanEqual(uint(layout.pointCount)), () => {
      Return();
    });
    const cell = cellIdOf(b.pos.element(instanceIndex).xyz, u, layout);
    const slot = atomicAdd(b.cellCount.element(cell), uint(1));
    If(slot.lessThan(uint(layout.maxPerCell)), () => {
      b.cellItems
        .element(cell.mul(uint(layout.maxPerCell)).add(slot))
        .assign(instanceIndex);
    });
  })().compute(layout.pointCount);
}

// What each cylinder is ploughing into, summed as fixed point: WGSL has no
// float atomics. The wires are pushed out in the solve; this is only the
// reaction the cylinder feels.
export function createContact(b, u, layout) {
  return Fn(() => {
    If(instanceIndex.greaterThanEqual(uint(layout.pointCount)), () => {
      Return();
    });
    const p = b.pos.element(instanceIndex);
    Loop({ start: uint(0), end: u.cylinderCount, type: 'uint' }, ({ i }) => {
      const body = b.bodies.element(i);
      const offset = p.xy.sub(body.xy);
      const distance = max(length(offset), float(1e-5));
      const depth = body.w.add(u.collideRadius).sub(distance);
      const back = p.z.sub(u.puckBack.sub(u.collideRadius));
      If(depth.greaterThan(0).and(back.greaterThan(depth)), () => {
        const push = offset.div(distance).mul(min(depth, u.collideRadius));
        const base = i.mul(uint(4));
        atomicAdd(b.reaction.element(base), int(push.x.mul(-FORCE_SCALE)));
        atomicAdd(
          b.reaction.element(base.add(1)),
          int(push.y.mul(-FORCE_SCALE))
        );
        atomicAdd(b.reaction.element(base.add(3)), int(1));
      });
    });
  })().compute(layout.pointCount);
}
