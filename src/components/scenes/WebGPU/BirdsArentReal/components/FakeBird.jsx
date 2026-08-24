/* eslint-disable no-param-reassign */

/* eslint-disable no-underscore-dangle */
import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { createPortal, useFrame, useGraph } from '@react-three/fiber';

import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

import { modelFile } from '@utils/appUtils';

import { BIRDS } from '../utils/birds';
import CameraHead from './CameraHead';

// Preload every registered species so swapping in Leva is instant.
Object.values(BIRDS).forEach((b) => useGLTF.preload(modelFile(b.file)));

const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
// Scratch objects for the per-frame head-aim math (avoid per-frame allocation).
const _A = new THREE.Vector3();
const _B = new THREE.Vector3();
const _C = new THREE.Vector3();
const _F = new THREE.Vector3();
const _N = new THREE.Vector3();
const _U = new THREE.Vector3();
const _R = new THREE.Vector3();
const _CA = new THREE.Vector3();
const _mid = new THREE.Vector3();
const _P = new THREE.Vector3();
const _m4 = new THREE.Matrix4();
const _qBasis = new THREE.Quaternion();
const _qOffset = new THREE.Quaternion();
const _qBone = new THREE.Quaternion();
const _WORLD_UP = new THREE.Vector3(0, 1, 0);

/**
 * One fake bird: an ordinary rigged bird body with a surveillance CameraHead bolted
 * onto its head. Driven by the species metadata in birds.js.
 *
 * Animation: to animate a *cloned* skinned instance, the mixer must be rooted at a
 * group that contains the clone's bones, and the skinned mesh must reference the
 * clone's skeleton. So we follow the repo's proven recipe (PosedRaccoon / Pigeon):
 * SkeletonUtils.clone -> useGraph(clone) -> render the root bone + skinned meshes
 * explicitly -> useAnimations(animations, group). `<primitive object={clone} />` is
 * the shortcut that breaks instances.
 *
 * Head aim: the camera head is parented to the head bone (so it inherits the bird's
 * scale + natural head motion), but its ORIENTATION is recomputed each frame from a
 * triangle of neck/head joints (meta.cam.orientJoints) so the lens points where the
 * head actually looks — instead of fighting one bone's arbitrary local axes. The
 * left/right surveillance sweep is layered on inside CameraHead. Species without
 * orientJoints fall back to the static yaw/pitch offsets.
 *
 * Behavior:
 *   - 'idle'   : stand and play the idle (look-around) clip.
 *   - 'wander' : play the walk clip and roam within `roamRadius`. Only meaningful for
 *                species with locomotion + a `walk` clip; else falls back to idle.
 */
function FakeBird({
  species = 'pigeon',
  behavior = 'idle',
  animate = true,
  roamRadius = 4,
  phase = 0,
  sweepRange,
  sweepSpeed,
  ledBlink = true,
  camScale, // head size override (else meta.cam.scale)
  camRot = { x: 0, y: 0, z: 0 }, // fine-tune aim (pitch/yaw/roll) on the head frame
  camOffset = { x: 0, y: 0, z: 0 }, // slide along head right/up/forward
  ledOffset = { x: 0, y: 0, z: 0 }, // REC LED position (normalized head units)
  hidden = false, // hide the body (Bird POV: don't sit inside our own lens)
  aimAtCursor = false, // Cursor-Follow: aim the lens at cursorTargetRef instead of sweeping
  cursorTargetRef = null, // ref<THREE.Vector3> world point every head stares at
  lensRef = null, // (node) => register the swept lens group for the POV camera
  ...props
}) {
  const meta = BIRDS[species] || BIRDS.pigeon;
  const group = useRef();
  const roamer = useRef();
  // Resolved per-clone: { mount, a, b, c } — the head-bone mount + triangle joints.
  const aim = useRef(null);
  // Smoothing state, kept in its OWN persistent ref so control changes / re-renders
  // never reset it (that was causing the camera to snap on every tweak).
  const smooth = useRef({
    up: new THREE.Vector3(0, 1, 0), // last good up axis (sign continuity)
    wq: new THREE.Quaternion(), // smoothed world orientation
    wp: new THREE.Vector3(), // smoothed world position
    ready: false, // seeded on the first aim frame
  });

  const { scene, animations } = useGLTF(modelFile(meta.file));
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  useGraph(clone);
  const { actions, mixer } = useAnimations(animations, group);

  // Pull the root bone + skinned meshes out of the clone so we can render them the
  // way the mixer expects (and turn on shadows).
  const { rootBone, skinnedMeshes } = useMemo(() => {
    let root = null;
    const sk = [];
    clone.traverse((o) => {
      if (o.isBone && !root) {
        let p = o;
        while (p.parent && p.parent.isBone) p = p.parent;
        root = p;
      }
      if (o.isSkinnedMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        o.frustumCulled = false;
        sk.push(o);
      }
    });
    return { rootBone: root, skinnedMeshes: sk };
  }, [clone]);

  const canWander = behavior === 'wander' && meta.locomotion && meta.clips.walk;
  const headScale = camScale ?? meta.cam.scale;
  const { orientJoints } = meta.cam;

  // A group we own, parented under the head bone; CameraHead is portaled into it.
  const headMount = useMemo(() => new THREE.Group(), []);

  // Pick + play the clip.
  useEffect(() => {
    const clipName = canWander ? meta.clips.walk : meta.clips.idle;
    const action = clipName ? actions[clipName] : null;
    if (!action) return undefined;
    mixer.stopAllAction();
    action.reset().play();
    action.time = (phase * 0.5) % (action.getClip().duration || 1);
    if (!animate) {
      action.paused = true;
      mixer.update(0);
    }
    return () => action.stop();
  }, [actions, mixer, canWander, meta, animate, phase]);

  // Attach the camera head to the head bone and resolve the aim joints. NOTE:
  // rendering <primitive object={rootBone}/> reparents the bone hierarchy OUT of
  // `clone`, so we look bones up on rootBone (the live tree), not on `clone`.
  useEffect(() => {
    const mount = rootBone?.getObjectByName(meta.headBone);
    if (!mount) {
      aim.current = null;
      return undefined;
    }
    mount.add(headMount);
    const a = orientJoints && rootBone.getObjectByName(orientJoints.base[0]);
    const b = orientJoints && rootBone.getObjectByName(orientJoints.base[1]);
    const c = orientJoints && rootBone.getObjectByName(orientJoints.apex);
    aim.current = { mount, a: a || null, b: b || null, c: c || null };
    smooth.current.ready = false; // re-seed only on a genuine (re)attach
    return () => mount.remove(headMount);
  }, [rootBone, meta.headBone, orientJoints, headMount]);

  // Scale always. Position/rotation are written here ONLY for the static fallback
  // (no triangle joints); when joints exist the per-frame aim fully owns the mount
  // transform, so we don't touch it here (touching it would fight / reset the aim).
  useEffect(() => {
    headMount.scale.setScalar(headScale);
    if (!orientJoints) {
      headMount.position.set(camOffset.x, camOffset.y, camOffset.z);
      headMount.rotation.set(camRot.x, camRot.y, camRot.z);
    }
  }, [headMount, headScale, orientJoints, camOffset, camRot]);

  // Roaming state.
  const roam = useMemo(
    () => ({ heading: phase, next: 0, x: 0, z: 0 }),
    [phase]
  );

  useFrame((_, dt) => {
    // Roam (only when this instance can actually walk).
    if (canWander && animate && roamer.current) {
      const r = roam;
      r.next -= dt;
      if (r.next <= 0) {
        r.heading += (Math.random() - 0.5) * 1.6;
        r.next = 2 + Math.random() * 3;
      }
      const step = meta.speed * dt;
      r.x += Math.sin(r.heading) * step;
      r.z += Math.cos(r.heading) * step;
      if (Math.hypot(r.x, r.z) > roamRadius) {
        r.heading = Math.atan2(-r.x, -r.z);
      }
      roamer.current.position.set(r.x, 0, r.z);
      _e.set(0, r.heading, 0);
      roamer.current.quaternion.slerp(_q.setFromEuler(_e), Math.min(1, dt * 4));
    }

    // Aim the camera head from the neck/head joint triangle.
    const cfg = aim.current;
    if (cfg && cfg.a && cfg.b && cfg.c) {
      rootBone.updateWorldMatrix(true, true);
      cfg.a.getWorldPosition(_A);
      cfg.b.getWorldPosition(_B);
      cfg.c.getWorldPosition(_C);

      _F.subVectors(_B, _A).normalize(); // forward: neck -> head

      // Cursor-Follow: override the natural head direction so the lens stares at the
      // shared cursor world point (from the head's base-joint midpoint).
      const staring = aimAtCursor && cursorTargetRef?.current;
      if (staring) {
        _mid.addVectors(_A, _B).multiplyScalar(0.5);
        _F.subVectors(cursorTargetRef.current, _mid);
        if (_F.lengthSq() < 1e-8) _F.set(0, 0, 1);
        _F.normalize();
      }

      // Up from the triangle normal — but guard the degenerate case (neck nearly
      // straight => apex on the base line => normal ~0 => sign flips). When the
      // triangle collapses, reuse the last good up; otherwise keep its sign
      // continuous so the head never snaps 180 deg. When staring at the cursor the
      // triangle is meaningless, so anchor up to world-up instead.
      _CA.subVectors(_C, _A);
      _N.crossVectors(_F, _CA); // triangle normal (lateral), unnormalized
      const s = smooth.current;
      if (staring) {
        _U.copy(_WORLD_UP);
      } else if (_N.lengthSq() > 1e-8) {
        _U.crossVectors(_N, _F).normalize();
        if (_U.dot(s.up) < 0) _U.negate();
      } else {
        _U.copy(s.up);
      }
      // Re-orthonormalize up against forward, then save it as the reference.
      _U.addScaledVector(_F, -_U.dot(_F));
      if (_U.lengthSq() < 1e-8) _U.copy(_WORLD_UP); // last-ditch fallback
      _U.normalize();
      s.up.copy(_U);

      _R.crossVectors(_U, _F).normalize(); // right (model +X)
      _m4.makeBasis(_R, _U, _F); // model +Z -> forward, +Y -> up
      _qBasis.setFromRotationMatrix(_m4);

      // Fine-tune rotation offset.
      _e.set(camRot.x, camRot.y, camRot.z);
      _qBasis.multiply(_qOffset.setFromEuler(_e));

      // Position: base-joint midpoint, offset along the head frame (right/up/fwd).
      _mid
        .addVectors(_A, _B)
        .multiplyScalar(0.5)
        .addScaledVector(_R, camOffset.x)
        .addScaledVector(_U, camOffset.y)
        .addScaledVector(_F, camOffset.z);

      // Frame-rate-independent damping toward the target so the head glides with the
      // bird instead of snapping. Seed on the first frame to avoid a startup lerp.
      if (s.ready) {
        const alpha = 1 - Math.exp(-18 * dt);
        s.wq.slerp(_qBasis, alpha);
        s.wp.lerp(_mid, alpha);
      } else {
        s.wq.copy(_qBasis);
        s.wp.copy(_mid);
        s.ready = true;
      }

      // Write the smoothed world transform onto OUR headMount group (a child of the
      // head bone) — NEVER the bone itself, or we'd deform the rig. Convert world ->
      // headMount-local via its parent (the head bone).
      const { parent } = headMount;
      if (parent) {
        headMount.position.copy(parent.worldToLocal(_P.copy(s.wp)));
        parent.getWorldQuaternion(_qBone);
        headMount.quaternion.copy(_qBone.invert().multiply(s.wq));
      }
    }
  });

  return (
    <group ref={group} visible={!hidden} {...props}>
      <group ref={roamer} scale={meta.modelScale}>
        {rootBone && <primitive object={rootBone} />}
        {skinnedMeshes.map((m) => (
          <primitive key={m.uuid} object={m} />
        ))}
        {createPortal(
          <CameraHead
            phase={phase}
            sweepRange={aimAtCursor ? 0 : sweepRange}
            sweepSpeed={sweepSpeed}
            ledBlink={ledBlink}
            ledOffset={ledOffset}
            lensRef={lensRef}
          />,
          headMount
        )}
      </group>
    </group>
  );
}

export default memo(FakeBird);
