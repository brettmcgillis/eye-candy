import { Matrix4, Quaternion, Vector3 } from 'three';

import { bodyMatrix } from './boneDriver';
import { RAGDOLL_GROUPS, capsuleColliderDesc } from './ragdoll';

const m = new Matrix4();
const p = new Vector3();
const q = new Quaternion();
const s = new Vector3();

function segmentShape(RAPIER, c) {
  return c.kind === 'sphere'
    ? RAPIER.ColliderDesc.ball(c.radius).setTranslation(...c.centre.toArray())
    : capsuleColliderDesc(RAPIER, c.from, c.to, c.radius);
}

// Ragdoll off: the corpse becomes one rigid body carrying every segment's
// collider in its current pose, and the segment bodies ride it kinematically.
export function createStatue(world, RAPIER, ragdoll, friction) {
  const { hips } = ragdoll.bodies;
  const statueInverse = bodyMatrix(hips, new Matrix4()).invert();
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(
        hips.translation().x,
        hips.translation().y,
        hips.translation().z
      )
      .setRotation(hips.rotation())
      .setLinearDamping(0.3)
      .setAngularDamping(1)
      .setCcdEnabled(true)
  );
  const offsets = {};
  const segmentOf = new Map();
  ragdoll.rig.segments.forEach((segment) => {
    const segmentBody = ragdoll.bodies[segment.id];
    const offset = bodyMatrix(segmentBody, new Matrix4()).premultiply(
      statueInverse
    );
    offsets[segment.id] = offset;
    segment.colliders.forEach((c) => {
      const desc = segmentShape(RAPIER, c);
      const t = desc.translation;
      m.compose(
        p.set(t.x, t.y, t.z),
        q.copy(desc.rotation),
        s.set(1, 1, 1)
      ).premultiply(offset);
      m.decompose(p, q, s);
      const collider = world.createCollider(
        desc
          .setTranslation(p.x, p.y, p.z)
          .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
          .setDensity(800)
          .setFriction(friction)
          .setCollisionGroups(RAGDOLL_GROUPS),
        body
      );
      segmentOf.set(collider.handle, segment.id);
    });
    segmentBody.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
  });
  if (Object.values(ragdoll.bodies).every((b) => b.isSleeping())) body.sleep();
  return { body, offsets, segmentOf };
}

export function followStatue(ragdoll, statue) {
  bodyMatrix(statue.body, m);
  Object.entries(statue.offsets).forEach(([id, offset]) => {
    new Matrix4().multiplyMatrices(m, offset).decompose(p, q, s);
    const body = ragdoll.bodies[id];
    body.setNextKinematicTranslation(p);
    body.setNextKinematicRotation(q);
  });
}

export function releaseStatue(world, RAPIER, ragdoll, statue) {
  const v = statue.body.linvel();
  const w = statue.body.angvel();
  const c = statue.body.worldCom();
  const asleep = statue.body.isSleeping();
  bodyMatrix(statue.body, m);
  Object.entries(statue.offsets).forEach(([id, offset]) => {
    new Matrix4().multiplyMatrices(m, offset).decompose(p, q, s);
    const body = ragdoll.bodies[id];
    body.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
    body.setTranslation(p, true);
    body.setRotation(q, true);
    const r = p.clone().sub(c);
    body.setLinvel(
      {
        x: v.x + w.y * r.z - w.z * r.y,
        y: v.y + w.z * r.x - w.x * r.z,
        z: v.z + w.x * r.y - w.y * r.x,
      },
      true
    );
    body.setAngvel(w, true);
    if (asleep) body.sleep();
  });
  world.removeRigidBody(statue.body);
}
