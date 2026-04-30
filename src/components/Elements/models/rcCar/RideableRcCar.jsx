import { useControls } from 'leva';
import * as THREE from 'three';

import React, { useEffect, useMemo, useRef } from 'react';

import { useKeyboardControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import {
  CoefficientCombineRule,
  CuboidCollider,
  RigidBody,
  useRapier,
} from '@react-three/rapier';

import { useFollowCam } from '../../../../modules/ecctrl/Ecctrl';
import { useJoystickControls } from '../../../../modules/ecctrl/stores/useJoystickControls';
import RcCar from './RcCar';

// ── Helpers ───────────────────────────────────────────────────────────────────

function useIsInsideKeyboardControls() {
  try {
    return !!useKeyboardControls();
  } catch {
    return false;
  }
}

function useRcCarConfig() {
  return useControls(
    'RC Car',
    {
      maxThrottle: { value: 8, min: 1, max: 30, step: 0.5 },
      maxSteerAngle: { value: 0.45, min: 0.1, max: 1.0, step: 0.01 },
      steerSpeed: { value: 2.5, min: 0.5, max: 8, step: 0.1 },
      steerDecay: { value: 4, min: 1, max: 10, step: 0.5 },
      steerTorqueMult: { value: 10, min: 0.1, max: 30, step: 0.5 },
      sprintMult: { value: 2.5, min: 1, max: 6, step: 0.1 },
      jumpVel: { value: 6, min: 1, max: 20, step: 0.5 },
      lateralDampingC: { value: 6, min: 1, max: 20, step: 0.5 },
      seatOffsetY: { value: 1.5, min: 1.0, max: 3, step: 0.05 },
      seatOffsetZ: { value: 0, min: -2, max: 2, step: 0.1 },
    },
    { collapsed: true }
  );
}

// ── Core physics component ─────────────────────────────────────────────────────

function RcCarPhysics({
  id,
  position,
  mounted,
  onMount,
  onDismount,
  ecctrlRef,
  standalone,
  followCamPivot,
  followCamObj,
  cameraCollisionDetect,
}) {
  const chassisRef = useRef(null);
  const chassisGroupRef = useRef(null);
  const nearPlayerRef = useRef(false);
  const steerAngleRef = useRef(0);
  const canJumpRef = useRef(false);
  const mountedRef = useRef(mounted);
  mountedRef.current = mounted;

  const { rapier, world } = useRapier();

  // Pre-allocated vectors — avoid GC per frame
  const _pos = useMemo(() => new THREE.Vector3(), []);
  const _quat = useMemo(() => new THREE.Quaternion(), []);
  const _fwd = useMemo(() => new THREE.Vector3(), []);
  const _right = useMemo(() => new THREE.Vector3(), []);
  const _impulse = useMemo(() => new THREE.Vector3(), []);
  const _seatPos = useMemo(() => new THREE.Vector3(), []);
  const _followCamWorldPos = useMemo(() => new THREE.Vector3(), []);
  const _playerPos = useMemo(() => new THREE.Vector3(), []);

  const MOUNT_RADIUS = 2.5;

  // ── Leva controls ────────────────────────────────────────────────────────────
  const {
    maxThrottle,
    maxSteerAngle,
    steerSpeed,
    steerDecay,
    steerTorqueMult,
    sprintMult,
    jumpVel,
    lateralDampingC,
    seatOffsetY,
    seatOffsetZ,
  } = useRcCarConfig();

  // ── Keyboard / joystick ──────────────────────────────────────────────────────
  const isInsideKeyboardControls = useIsInsideKeyboardControls();
  const [subscribeKeys, getKeys] = isInsideKeyboardControls
    ? useKeyboardControls()
    : [null, null];

  const getJoystickValues = useJoystickControls(
    (state) => state.getJoystickValues
  );

  // ── Switch capsule to kinematic while mounted (no gravity, no collision forces) ──
  useEffect(() => {
    if (standalone || !ecctrlRef?.current) return;
    if (mounted) {
      ecctrlRef.current.setBodyType?.(2);
    } else {
      // Restore dynamic — teleport player beside the car's current position
      if (chassisRef.current) {
        const t = chassisRef.current.translation();
        ecctrlRef.current.setPosition(new THREE.Vector3(t.x + 2, t.y + 1, t.z));
      }
      ecctrlRef.current.setBodyType?.(0);
    }
  }, [mounted, standalone, ecctrlRef]);

  // ── Mount / dismount via action1 ─────────────────────────────────────────────
  useEffect(() => {
    if (standalone || !subscribeKeys) return;
    return subscribeKeys(
      (state) => state.action1,
      (pressed) => {
        if (!pressed) return;
        if (!mountedRef.current && nearPlayerRef.current) {
          onMount?.(id, chassisGroupRef);
        } else if (mountedRef.current) {
          onDismount?.();
        }
      }
    );
  }, [id, onMount, onDismount, standalone, subscribeKeys]);

  // ── Physics frame loop ───────────────────────────────────────────────────────
  useFrame((state, delta) => {
    if (!chassisRef.current) return;

    const trans = chassisRef.current.translation();
    const rot = chassisRef.current.rotation();
    _pos.set(trans.x, trans.y, trans.z);
    _quat.set(rot.x, rot.y, rot.z, rot.w);
    const linvel = chassisRef.current.linvel();

    // ── Input ──────────────────────────────────────────────────────────────────
    const joystick = getJoystickValues?.();

    // Read current key state synchronously (same as Ecctrl) — avoids stale-ref issues
    const keys = getKeys?.() ?? {};
    let forward = keys.forward ?? false;
    let backward = keys.backward ?? false;
    let leftward = keys.leftward ?? false;
    let rightward = keys.rightward ?? false;
    const sprinting = keys.run ?? false;
    const jumping = keys.jump ?? false;

    if (joystick?.joystickDis > 0) {
      const jx = Math.sin(joystick.joystickAng);
      const jy = Math.cos(joystick.joystickAng);
      if (jy > 0.3) forward = true;
      if (jy < -0.3) backward = true;
      if (jx > 0.3) leftward = true;
      if (jx < -0.3) rightward = true;
    }

    // Only drive when someone is in the car
    const isActive = standalone || mounted;
    const steerInput = isActive ? (leftward ? 1 : rightward ? -1 : 0) : 0;

    // ── Steer angle ────────────────────────────────────────────────────────────
    steerAngleRef.current = THREE.MathUtils.clamp(
      steerAngleRef.current + steerInput * steerSpeed * delta,
      -maxSteerAngle,
      maxSteerAngle
    );
    if (steerInput === 0) {
      steerAngleRef.current = THREE.MathUtils.lerp(
        steerAngleRef.current,
        0,
        steerDecay * delta
      );
    }

    // ── Chassis direction vectors ──────────────────────────────────────────────
    // RcCar model faces -Z in local space (Blender/GLTF convention)
    _fwd.set(0, 0, -1).applyQuaternion(_quat);
    _right.set(1, 0, 0).applyQuaternion(_quat);

    // ── Steering torque ───────────────────────────────────────────────────────
    chassisRef.current.applyTorqueImpulse(
      { x: 0, y: steerAngleRef.current * steerTorqueMult * delta, z: 0 },
      true
    );

    // ── Throttle ───────────────────────────────────────────────────────────────
    if (isActive) {
      const driveInput = forward ? 1 : backward ? -1 : 0;
      if (driveInput !== 0) {
        const throttle = maxThrottle * (sprinting ? sprintMult : 1);
        _impulse.copy(_fwd).multiplyScalar(driveInput * throttle * delta);
        chassisRef.current.applyImpulse(
          { x: _impulse.x, y: 0, z: _impulse.z },
          true
        );
      }
    }

    // ── Ground detection via downcast ray (same pattern as Ecctrl canJump) ──────
    // Car collider half-height = 0.3; forgiveness 0.15 m
    const rayOrigin = { x: trans.x, y: trans.y, z: trans.z };
    const rayDir = { x: 0, y: -1, z: 0 };
    const ray = new rapier.Ray(rayOrigin, rayDir);
    const rayHit = world.castRay(
      ray,
      0.55,
      true,
      undefined,
      undefined,
      undefined,
      chassisRef.current
    );
    canJumpRef.current = !!(rayHit && rayHit.timeOfImpact < 0.55);

    // ── Jump (gate on canJump only — identical to Ecctrl; no rising-edge needed) ──
    if (isActive && jumping && canJumpRef.current) {
      chassisRef.current.setLinvel(
        { x: linvel.x, y: jumpVel, z: linvel.z },
        true
      );
    }

    // ── Lateral slip damping (always — keeps car from sliding on slopes) ───────
    const lateralVel =
      _right.x * linvel.x + _right.y * linvel.y + _right.z * linvel.z;
    if (Math.abs(lateralVel) > 0.01) {
      chassisRef.current.applyImpulse(
        {
          x: -_right.x * lateralVel * lateralDampingC,
          y: 0,
          z: -_right.z * lateralVel * lateralDampingC,
        },
        true
      );
    }

    // ── Teleport kinematic capsule to seat each frame so it follows the car ──────
    // seatOffsetY clamped to 1.2 min so capsule bottom (offset - 0.65) stays
    // above the car top collider (0.3 half-height) with ~0.25 m clearance.
    if (!standalone && mountedRef.current && ecctrlRef?.current) {
      const safeY = Math.max(seatOffsetY, 1.2);
      _seatPos.set(trans.x, trans.y + safeY, trans.z + seatOffsetZ);
      ecctrlRef.current.setPosition(_seatPos);
    }

    // ── Proximity detection ───────────────────────────────────────────────────
    if (!standalone && !mountedRef.current && ecctrlRef?.current?.group) {
      ecctrlRef.current.group.getWorldPosition(_playerPos);
      nearPlayerRef.current = _pos.distanceTo(_playerPos) < MOUNT_RADIUS;
    }

    // ── Follow-cam (standalone or mounted in mixed scene) ──────────────────────
    if (standalone && followCamPivot) {
      // Standalone: full useFollowCam control
      followCamPivot.position.set(
        trans.x,
        trans.y + seatOffsetY,
        trans.z + seatOffsetZ
      );
      if (followCamObj) {
        followCamObj.getWorldPosition(_followCamWorldPos);
        state.camera.position.lerp(
          _followCamWorldPos,
          1 - Math.exp(-25 * delta)
        );
        state.camera.lookAt(followCamPivot.position);
      }
      cameraCollisionDetect?.(delta);
    } else if (mountedRef.current) {
      // Mounted in mixed scene: fixed chase cam directly behind the car
      const camDist = 6;
      const camHeight = 2.5;
      _followCamWorldPos.set(
        trans.x + _fwd.x * -camDist,
        trans.y + camHeight,
        trans.z + _fwd.z * -camDist
      );
      state.camera.position.lerp(_followCamWorldPos, 1 - Math.exp(-8 * delta));
      state.camera.lookAt(trans.x, trans.y + 0.5, trans.z);
    }
  });

  return (
    <RigidBody
      ref={chassisRef}
      colliders={false}
      position={position}
      type="dynamic"
      friction={0}
      linearDamping={0.4}
      angularDamping={2}
      canSleep={false}
      userData={{ excludeEcctrlRay: true }}
    >
      <CuboidCollider
        args={[1.0, 0.3, 1.8]}
        friction={0}
        frictionCombineRule={CoefficientCombineRule.Min}
      />

      <group ref={chassisGroupRef}>
        <RcCar />
      </group>
    </RigidBody>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

/**
 * RideableRcCar
 *
 * Props (mixed-scene mode):
 *   id          — unique rideable id string
 *   position    — initial [x, y, z]
 *   ecctrlRef   — ref to Ecctrl instance (proximity detection only)
 *   mounted     — boolean controlled by useRideableState.mountedId
 *   onMount     — (id: string, groupRef: RefObject<Group>) => void
 *   onDismount  — () => void
 *
 * Props (standalone mode):
 *   standalone  — true: always active, owns its own follow-cam, no mount sensor
 *   position    — initial [x, y, z]
 */
export default function RideableRcCar({
  standalone = false,
  id = 'rccar',
  position = [0, 0.5, 0],
  ecctrlRef = null,
  mounted = false,
  onMount = null,
  onDismount = null,
}) {
  // useFollowCam only needed for standalone (mouse-look orbit cam)
  const standaloneFollowCam = useFollowCam(
    standalone ? { camInitDis: -5, camMaxDis: -7, camMinDis: -0.7 } : undefined
  );

  return (
    <RcCarPhysics
      id={id}
      position={position}
      mounted={mounted}
      onMount={onMount}
      onDismount={onDismount}
      ecctrlRef={ecctrlRef}
      standalone={standalone}
      followCamPivot={standalone ? standaloneFollowCam.pivot : null}
      followCamObj={standalone ? standaloneFollowCam.followCam : null}
      cameraCollisionDetect={
        standalone ? standaloneFollowCam.cameraCollisionDetect : null
      }
    />
  );
}
