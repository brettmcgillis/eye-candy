import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';
import { useBeforePhysicsStep, useRapier } from '@react-three/rapier';

import { Matrix4, Quaternion, Vector3 } from 'three';

import { bodyMatrix } from '../utils/boneDriver';
import { LOOSE_GROUPS, RAGDOLL_GROUPS } from '../utils/ragdoll';

const HAND = 'forearmR';

const m = new Matrix4();
const p = new Vector3();
const q = new Quaternion();
const scale = new Vector3();
const r = new Vector3();

function bladeShapes(RAPIER, sword) {
  return [
    RAPIER.ColliderDesc.cuboid(0.025, sword.bladeLength / 2, 0.006)
      .setTranslation(0, sword.bladeLength / 2, 0)
      .setDensity(2500),
    RAPIER.ColliderDesc.cuboid(
      sword.guardHalfWidth,
      sword.gripLength / 2 + 0.015,
      0.015
    )
      .setTranslation(0, -sword.gripLength / 2, 0)
      .setDensity(2500),
  ];
}

// The knight's own sword: welded to the fist until a jolt on the sword arm
// beats the threshold, then its own rigid body.
function HandSword({
  dropEnabled,
  dropThreshold,
  generation,
  gripWorld,
  ragdoll,
  rig,
  sword,
}) {
  const { rapier, world } = useRapier();
  const meshRef = useRef(null);
  const state = useRef({ held: [], loose: null, previous: null });

  const local = useMemo(() => {
    const { origin } = rig.byId[HAND];
    const out = gripWorld.clone();
    out.elements[12] -= origin.x;
    out.elements[13] -= origin.y;
    out.elements[14] -= origin.z;
    return out;
  }, [gripWorld, rig]);

  useEffect(() => {
    const s = state.current;
    const hand = ragdoll.bodies[HAND];
    local.decompose(p, q, scale);
    s.held = bladeShapes(rapier, sword).map((desc) => {
      const t = desc.translation;
      const at = new Vector3(t.x, t.y, t.z).applyMatrix4(local);
      const rot = new Quaternion().copy(desc.rotation).premultiply(q);
      return world.createCollider(
        desc
          .setTranslation(at.x, at.y, at.z)
          .setRotation(rot)
          .setCollisionGroups(RAGDOLL_GROUPS),
        hand
      );
    });
    s.previous = null;
    return () => {
      s.held.forEach((c) => {
        if (world.getCollider(c.handle)) world.removeCollider(c, false);
      });
      s.held = [];
      if (s.loose) world.removeRigidBody(s.loose);
      s.loose = null;
    };
  }, [generation, local, ragdoll, rapier, sword, world]);

  useBeforePhysicsStep(() => {
    const s = state.current;
    if (!dropEnabled || s.loose || !s.held.length) return;
    const hand = ragdoll.bodies[HAND];
    if (hand.isSleeping()) {
      s.previous = null;
      return;
    }
    const v = hand.linvel();
    const { previous } = s;
    s.previous = { x: v.x, y: v.y, z: v.z };
    if (dropThreshold > 0) {
      if (!previous) return;
      const jolt = Math.hypot(
        v.x - previous.x,
        v.y - previous.y,
        v.z - previous.z
      );
      if (jolt < dropThreshold) return;
    }

    bodyMatrix(hand, m).multiply(local).decompose(p, q, scale);
    s.held.forEach((c) => world.removeCollider(c, true));
    s.held = [];

    const w = hand.angvel();
    const c = hand.worldCom();
    r.set(p.x - c.x, p.y - c.y, p.z - c.z);
    const body = world.createRigidBody(
      rapier.RigidBodyDesc.dynamic()
        .setTranslation(p.x, p.y, p.z)
        .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
        .setLinvel(
          v.x + w.y * r.z - w.z * r.y,
          v.y + w.z * r.x - w.x * r.z,
          v.z + w.x * r.y - w.y * r.x
        )
        .setAngvel(w)
        .setCcdEnabled(true)
    );
    bladeShapes(rapier, sword).forEach((desc) =>
      world.createCollider(
        desc.setFriction(0.7).setCollisionGroups(LOOSE_GROUPS),
        body
      )
    );
    s.loose = body;
  });

  useFrame(() => {
    const mesh = meshRef.current;
    const s = state.current;
    if (!mesh) return;
    if (s.loose) bodyMatrix(s.loose, mesh.matrix);
    else bodyMatrix(ragdoll.bodies[HAND], mesh.matrix).multiply(local);
    mesh.matrixWorldNeedsUpdate = true;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={sword.geometry}
      material={sword.material}
      matrixAutoUpdate={false}
      castShadow
      receiveShadow
    />
  );
}

export default memo(HandSword);
