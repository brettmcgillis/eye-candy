/* eslint-disable no-param-reassign */
import { Quaternion, Vector3 } from 'three';

const FORWARD = new Vector3(0, 0, 1);
const DEG = Math.PI / 180;

const side = (s) => [
  {
    id: `upperArm${s}`,
    bone: `upper_arm${s}`,
    parent: 'chest',
    colliders: [{ from: `upper_arm${s}`, to: `forearm${s}`, radius: 0.065 }],
    joint: { type: 'spherical', cone: 95, twist: 70 },
  },
  {
    id: `forearm${s}`,
    bone: `forearm${s}`,
    parent: `upperArm${s}`,
    colliders: [{ from: `forearm${s}`, to: `f_middle03${s}`, radius: 0.055 }],
    joint: { type: 'hinge', limits: [-5, 145] },
  },
  {
    id: `thigh${s}`,
    bone: `thigh${s}`,
    parent: 'hips',
    colliders: [{ from: `thigh${s}`, to: `shin${s}`, radius: 0.085 }],
    joint: { type: 'spherical', cone: 70, coneForward: 45, twist: 35 },
  },
  {
    id: `shin${s}`,
    bone: `shin${s}`,
    parent: `thigh${s}`,
    colliders: [
      { from: `shin${s}`, to: `foot${s}`, radius: 0.065 },
      { from: `foot${s}`, to: `toe${s}`, radius: 0.05 },
    ],
    joint: { type: 'hinge', limits: [-145, 5] },
  },
];

export const SEGMENTS = [
  {
    id: 'hips',
    bone: 'spine',
    colliders: [
      {
        from: ['spine', [-0.09, 0.03, 0.02]],
        to: ['spine', [0.09, 0.03, 0.02]],
        radius: 0.12,
      },
    ],
  },
  {
    id: 'chest',
    bone: 'spine001',
    parent: 'hips',
    colliders: [
      {
        from: ['spine001', [0, 0.05, 0.01]],
        to: ['spine004', [0, -0.1, 0]],
        radius: 0.16,
      },
      {
        from: ['spine004', [-0.15, -0.08, -0.01]],
        to: ['spine004', [0.15, -0.08, -0.01]],
        radius: 0.1,
      },
    ],
    joint: { type: 'spherical', towards: 'spine004', cone: 30, twist: 20 },
  },
  {
    id: 'head',
    bone: 'head',
    parent: 'chest',
    colliders: [{ sphere: ['head', [0, 0.12, 0.01]], radius: 0.14 }],
    joint: {
      type: 'spherical',
      towards: ['head', [0, 0.2, 0]],
      cone: 45,
      twist: 50,
    },
  },
  ...side('L'),
  ...side('R'),
];

function restPoint(bones, spec) {
  const [key, offset] = Array.isArray(spec) ? spec : [spec, [0, 0, 0]];
  return bones[key]
    .getWorldPosition(new Vector3())
    .add(new Vector3().fromArray(offset));
}

// Rest descriptors in the identity-rest convention: every body starts world-
// aligned at its bone's head, so joint axes read the same in both bodies'
// local frames and a body's rotation IS its rotation away from rest.
export function describeRagdoll(bones) {
  const byId = {};
  const segments = SEGMENTS.map((def) => {
    const origin = restPoint(bones, def.bone);
    const bone = bones[def.bone];
    const segment = {
      ...def,
      origin,
      restBoneQuaternion: bone.getWorldQuaternion(new Quaternion()),
      restBoneScale: bone.getWorldScale(new Vector3()),
      colliders: def.colliders.map((c) =>
        c.sphere
          ? {
              kind: 'sphere',
              centre: restPoint(bones, c.sphere).sub(origin),
              radius: c.radius,
            }
          : {
              kind: 'capsule',
              from: restPoint(bones, c.from).sub(origin),
              to: restPoint(bones, c.to).sub(origin),
              radius: c.radius,
            }
      ),
    };
    byId[def.id] = segment;
    return segment;
  });

  segments.forEach((segment) => {
    if (!segment.parent) return;
    const parent = byId[segment.parent];
    const { joint } = segment;
    const end = joint.towards
      ? restPoint(bones, joint.towards)
      : segment.origin.clone().add(segment.colliders[0].to);
    const dir = end.sub(segment.origin).normalize();
    const hingeAxis = new Vector3().crossVectors(dir, FORWARD).normalize();
    const coneAxis = dir
      .clone()
      .applyAxisAngle(hingeAxis, (joint.coneForward ?? 0) * DEG);
    segment.jointRest = {
      anchorParent: segment.origin.clone().sub(parent.origin),
      dir,
      hingeAxis,
      coneAxis,
      cone: (joint.cone ?? 0) * DEG,
      twist: (joint.twist ?? 0) * DEG,
      limits: (joint.limits ?? [0, 0]).map((d) => d * DEG),
    };
  });

  return { segments, byId };
}

// Forward kinematics over the rest descriptors: per-segment relative
// rotations (degrees, world-rest axes) composed down the chain.
export function solvePose({ segments }, { root, joints = {} }) {
  const out = {};
  segments.forEach((segment) => {
    const [x, y, z] = segment.parent
      ? (joints[segment.id] ?? [0, 0, 0])
      : root.rotation;
    const local = new Quaternion().setFromAxisAngle(
      new Vector3(1, 0, 0),
      x * DEG
    );
    local.premultiply(
      new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), y * DEG)
    );
    local.premultiply(
      new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), z * DEG)
    );
    if (!segment.parent) {
      out[segment.id] = {
        position: new Vector3().fromArray(root.position),
        quaternion: local,
      };
      return;
    }
    const parent = out[segment.parent];
    out[segment.id] = {
      position: segment.jointRest.anchorParent
        .clone()
        .applyQuaternion(parent.quaternion)
        .add(parent.position),
      quaternion: parent.quaternion.clone().multiply(local),
    };
  });
  return out;
}
