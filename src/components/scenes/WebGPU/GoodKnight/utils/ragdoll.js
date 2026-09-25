/* eslint-disable no-bitwise, no-param-reassign */
import { Quaternion, Vector3 } from 'three';

import { solvePose } from './skeleton';

export const GROUP = { world: 0x1, ragdoll: 0x2, loose: 0x4 };
export const groups = (member, filter) => (member << 16) | filter;

export const RAGDOLL_GROUPS = groups(GROUP.ragdoll, GROUP.world | GROUP.loose);
export const LOOSE_GROUPS = groups(
  GROUP.loose,
  GROUP.world | GROUP.ragdoll | GROUP.loose
);
export const PICK_GROUPS = groups(0xffff, GROUP.ragdoll | GROUP.loose);

const UP = new Vector3(0, 1, 0);
const LIMIT_BIAS = 0.25;
const MAX_CORRECTION = 12;

const tmpQP = new Quaternion();
const tmpQC = new Quaternion();
const tmpRel = new Quaternion();
const tmpA = new Vector3();
const tmpB = new Vector3();
const tmpW = new Vector3();

export function capsuleColliderDesc(RAPIER, from, to, radius) {
  const dir = tmpA.subVectors(to, from);
  const length = dir.length();
  const q = new Quaternion().setFromUnitVectors(UP, dir.normalize());
  return RAPIER.ColliderDesc.capsule(Math.max(length / 2, 0.001), radius)
    .setTranslation(...from.clone().add(to).multiplyScalar(0.5).toArray())
    .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
}

export function createRagdoll(
  world,
  RAPIER,
  rig,
  { damping, friction, linearDamping = 0.15 }
) {
  const bodies = {};
  rig.segments.forEach((segment) => {
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(...segment.origin.toArray())
        .setLinearDamping(linearDamping)
        .setAngularDamping(damping)
        .setCcdEnabled(true)
    );
    segment.colliders.forEach((c) => {
      const desc =
        c.kind === 'sphere'
          ? RAPIER.ColliderDesc.ball(c.radius).setTranslation(
              ...c.centre.toArray()
            )
          : capsuleColliderDesc(RAPIER, c.from, c.to, c.radius);
      world.createCollider(
        desc
          .setDensity(800)
          .setFriction(friction)
          .setRestitution(0.05)
          .setCollisionGroups(RAGDOLL_GROUPS),
        body
      );
    });
    bodies[segment.id] = body;
  });

  const joints = rig.segments
    .filter((segment) => segment.parent)
    .map((segment) => {
      const { anchorParent, hingeAxis, limits } = segment.jointRest;
      const a1 = { x: anchorParent.x, y: anchorParent.y, z: anchorParent.z };
      const a2 = { x: 0, y: 0, z: 0 };
      const data =
        segment.joint.type === 'hinge'
          ? RAPIER.JointData.revolute(a1, a2, {
              x: hingeAxis.x,
              y: hingeAxis.y,
              z: hingeAxis.z,
            })
          : RAPIER.JointData.spherical(a1, a2);
      const joint = world.createImpulseJoint(
        data,
        bodies[segment.parent],
        bodies[segment.id],
        true
      );
      if (segment.joint.type === 'hinge') joint.setLimits(limits[0], limits[1]);
      joint.setContactsEnabled(false);
      return { joint, segment };
    });

  return { bodies, joints, rig };
}

export function removeRagdoll(world, ragdoll) {
  Object.values(ragdoll.bodies).forEach((body) => world.removeRigidBody(body));
}

function correct(parent, child, axisWorld, violation, dt) {
  const wP = parent.angvel();
  const wC = child.angvel();
  const rate =
    (wC.x - wP.x) * axisWorld.x +
    (wC.y - wP.y) * axisWorld.y +
    (wC.z - wP.z) * axisWorld.z;
  const target = -Math.min((violation * LIMIT_BIAS) / dt, MAX_CORRECTION);
  if (rate <= target) return;
  const delta = target - rate;
  const mP = parent.mass();
  const mC = child.mass();
  const kC = mP / (mP + mC);
  const kP = mC / (mP + mC);
  child.setAngvel(
    {
      x: wC.x + axisWorld.x * delta * kC,
      y: wC.y + axisWorld.y * delta * kC,
      z: wC.z + axisWorld.z * delta * kC,
    },
    true
  );
  parent.setAngvel(
    {
      x: wP.x - axisWorld.x * delta * kP,
      y: wP.y - axisWorld.y * delta * kP,
      z: wP.z - axisWorld.z * delta * kP,
    },
    true
  );
}

// Rapier's JS spherical joints take no limits, so swing (cone) and twist are
// held with velocity-level corrections before each step.
export function enforceJointLimits(ragdoll, dt) {
  ragdoll.joints.forEach(({ segment }) => {
    if (segment.joint.type !== 'spherical') return;
    const parent = ragdoll.bodies[segment.parent];
    const child = ragdoll.bodies[segment.id];
    if (parent.isSleeping() && child.isSleeping()) return;
    const { dir, coneAxis, cone, twist } = segment.jointRest;

    tmpQP.copy(parent.rotation());
    tmpQC.copy(child.rotation());
    tmpRel.copy(tmpQP).invert().multiply(tmpQC);

    const swung = tmpA.copy(dir).applyQuaternion(tmpRel);
    const swing = Math.acos(Math.min(1, Math.max(-1, swung.dot(coneAxis))));
    if (swing > cone) {
      tmpW.crossVectors(coneAxis, swung);
      if (tmpW.lengthSq() > 1e-10) {
        tmpW.normalize().applyQuaternion(tmpQP);
        correct(parent, child, tmpW, swing - cone, dt);
      }
    }

    const along = tmpRel.x * dir.x + tmpRel.y * dir.y + tmpRel.z * dir.z;
    let angle = 2 * Math.atan2(along, tmpRel.w);
    if (angle > Math.PI) angle -= 2 * Math.PI;
    if (angle < -Math.PI) angle += 2 * Math.PI;
    if (Math.abs(angle) > twist) {
      tmpB.copy(dir).applyQuaternion(tmpQC).multiplyScalar(Math.sign(angle));
      correct(parent, child, tmpB, Math.abs(angle) - twist, dt);
    }
  });
}

export function placeRagdoll(ragdoll, transforms) {
  Object.entries(ragdoll.bodies).forEach(([id, body]) => {
    const t = transforms[id];
    body.setTranslation(t.position, true);
    body.setRotation(t.quaternion, true);
    body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  });
}

export function poseTransforms(ragdoll, pose) {
  if (pose.bodies) {
    return Object.fromEntries(
      Object.entries(pose.bodies).map(([id, [px, py, pz, qx, qy, qz, qw]]) => [
        id,
        {
          position: new Vector3(px, py, pz),
          quaternion: new Quaternion(qx, qy, qz, qw),
        },
      ])
    );
  }
  return solvePose(ragdoll.rig, pose.drop);
}

export function settleRagdoll(world, ragdoll, { steps, beforeStep }) {
  const previous = world.timestep;
  world.timestep = 1 / 60;
  for (let i = 0; i < steps; i += 1) {
    enforceJointLimits(ragdoll, world.timestep);
    beforeStep?.();
    world.step();
  }
  world.timestep = previous;
  Object.values(ragdoll.bodies).forEach((body) => body.sleep());
}

export function captureRagdoll(ragdoll) {
  const round = (v) => Math.round(v * 1e4) / 1e4;
  return Object.fromEntries(
    Object.entries(ragdoll.bodies).map(([id, body]) => {
      const p = body.translation();
      const q = body.rotation();
      return [id, [p.x, p.y, p.z, q.x, q.y, q.z, q.w].map(round)];
    })
  );
}
