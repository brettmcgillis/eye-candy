import React, { useEffect, useMemo, useRef } from 'react';

import { useKeyboardControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import {
  BallCollider,
  CoefficientCombineRule,
  CuboidCollider,
  RigidBody,
  useRapier,
} from '@react-three/rapier';

import { useControls } from 'leva';
import * as THREE from 'three';

import { useFollowCam, useJoystickControls } from '@modules/ecctrl';

import RcCar from './RcCar';

// ── Helpers ───────────────────────────────────────────────────────────────────

function useIsInsideKeyboardControls() {
  try {
    return !!useKeyboardControls();
  } catch {
    return false;
  }
}

const WHEEL_CONTACT_OFFSETS = [
  [-0.81, 0.116, -0.835],
  [0.81, 0.116, -0.835],
  [-0.835, 0.116, 1.272],
  [0.835, 0.116, 1.272],
];
const WHEEL_CONTACT_RADIUS = 0.35;
const JUMP_PLANAR_DEADZONE = 0.35;

function useRcCarConfig() {
  return useControls(
    'RC Car',
    {
      maxThrottle: { value: 8, min: 1, max: 30, step: 0.5 },
      driveAccelTime: { value: 0.45, min: 0.1, max: 2, step: 0.05 },
      brakeAccelTime: { value: 0.2, min: 0.05, max: 1.5, step: 0.05 },
      maxSteerAngle: { value: 0.45, min: 0.1, max: 1.0, step: 0.01 },
      steerSpeed: { value: 2.5, min: 0.5, max: 8, step: 0.1 },
      steerDecay: { value: 4, min: 1, max: 10, step: 0.5 },
      steerTorqueMult: { value: 10, min: 0.1, max: 30, step: 0.5 },
      driftMinSpeed: { value: 2.2, min: 0.5, max: 12, step: 0.1 },
      handbrakeGripMult: { value: 0.3, min: 0.05, max: 1, step: 0.05 },
      handbrakeYawBoost: { value: 24, min: 0, max: 40, step: 0.5 },
      handbrakeSideKick: { value: 10, min: 0, max: 30, step: 0.5 },
      handbrakeSpeedBleed: { value: 0.9, min: 0, max: 6, step: 0.1 },
      handbrakeDriveMult: { value: 0.6, min: 0, max: 1.5, step: 0.05 },
      sprintMult: { value: 2.5, min: 1, max: 6, step: 0.1 },
      jumpVel: { value: 6, min: 1, max: 20, step: 0.5 },
      lateralDampingC: { value: 6, min: 1, max: 20, step: 0.5 },
      selfRightDelay: { value: 0.12, min: 0, max: 2, step: 0.05 },
      selfRightUpDot: { value: -0.35, min: -1, max: 0, step: 0.05 },
      selfRightLift: { value: 0.38, min: 0.1, max: 0.8, step: 0.02 },
      selfRightMaxSpeed: { value: 5, min: 0.5, max: 20, step: 0.5 },
      selfRightSpinDamping: { value: 5, min: 0, max: 20, step: 0.5 },
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
  const forwardSpeedRef = useRef(0);
  const sprintingRef = useRef(false);
  const reversingRef = useRef(false);
  const canJumpRef = useRef(false);
  const mountedRef = useRef(mounted);
  const wasMountedRef = useRef(mounted);
  const upsideTimeRef = useRef(0);
  const riderVisualHomeRef = useRef(null);
  mountedRef.current = mounted;

  const { rapier, world } = useRapier();

  // Pre-allocated vectors — avoid GC per frame
  const _pos = useMemo(() => new THREE.Vector3(), []);
  const _quat = useMemo(() => new THREE.Quaternion(), []);
  const _parentWorldQuat = useMemo(() => new THREE.Quaternion(), []);
  const _fwd = useMemo(() => new THREE.Vector3(), []);
  const _visualPos = useMemo(() => new THREE.Vector3(), []);
  const _visualQuat = useMemo(() => new THREE.Quaternion(), []);
  const _visualFwd = useMemo(() => new THREE.Vector3(), []);
  const _localFwd = useMemo(() => new THREE.Vector3(), []);
  const _right = useMemo(() => new THREE.Vector3(), []);
  const _up = useMemo(() => new THREE.Vector3(), []);
  const _impulse = useMemo(() => new THREE.Vector3(), []);
  const _seatPos = useMemo(() => new THREE.Vector3(), []);
  const _wheelProbePos = useMemo(() => new THREE.Vector3(), []);
  const _followCamWorldPos = useMemo(() => new THREE.Vector3(), []);
  const _playerPos = useMemo(() => new THREE.Vector3(), []);
  const _worldUp = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  const MOUNT_RADIUS = 2.5;

  // ── Leva controls ────────────────────────────────────────────────────────────
  const {
    maxThrottle,
    driveAccelTime,
    brakeAccelTime,
    maxSteerAngle,
    steerSpeed,
    steerDecay,
    steerTorqueMult,
    driftMinSpeed,
    handbrakeGripMult,
    handbrakeYawBoost,
    handbrakeSideKick,
    handbrakeSpeedBleed,
    handbrakeDriveMult,
    sprintMult,
    jumpVel,
    lateralDampingC,
    selfRightDelay,
    selfRightUpDot,
    selfRightLift,
    selfRightMaxSpeed,
    selfRightSpinDamping,
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
    if (standalone || !ecctrlRef?.current) {
      wasMountedRef.current = mounted;
      return;
    }

    const wasMounted = wasMountedRef.current;
    wasMountedRef.current = mounted;

    if (mounted) {
      ecctrlRef.current.setBodyType?.(2);

      const riderGroup = ecctrlRef.current.group;
      if (riderGroup && chassisGroupRef.current && riderGroup.parent) {
        riderVisualHomeRef.current = riderGroup.parent;
        if (riderGroup.parent !== chassisGroupRef.current) {
          chassisGroupRef.current.attach(riderGroup);
        }
      }
    } else if (wasMounted) {
      // Restore dynamic in-place so rideables do not overwrite the player's
      // spawn or jump them beside the car when the component mounts/unmounts.
      ecctrlRef.current.setBodyType?.(0);

      const riderGroup = ecctrlRef.current.group;
      const riderVisualHome = riderVisualHomeRef.current;
      if (
        riderGroup &&
        riderVisualHome &&
        riderGroup.parent !== riderVisualHome
      ) {
        riderVisualHome.attach(riderGroup);
        // Reset local transform: the physics body is already at the seat world
        // position, so the model group should sit at its origin, not at whatever
        // offset `attach` computed from the chassis local-space seat position.
        riderGroup.position.set(0, 0, 0);
        riderGroup.quaternion.identity();
      }
      ecctrlRef.current.faceCameraDirection?.();
    }
  }, [mounted, standalone, ecctrlRef]);

  // ── Mount / dismount via action1 (keyboard) ──────────────────────────────────
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

  // ── Mount / dismount via button4 (joystick) ───────────────────────────────────
  useEffect(() => {
    if (standalone) return;
    return useJoystickControls.subscribe(
      (state) => state.curButton4Pressed,
      (pressed) => {
        if (!pressed) return;
        if (!mountedRef.current && nearPlayerRef.current) {
          onMount?.(id, chassisGroupRef);
        } else if (mountedRef.current) {
          onDismount?.();
        }
      }
    );
  }, [id, onMount, onDismount, standalone]);

  // ── Physics frame loop ───────────────────────────────────────────────────────
  useFrame((state, delta) => {
    if (!chassisRef.current) return;

    const trans = chassisRef.current.translation();
    const rot = chassisRef.current.rotation();
    _pos.set(trans.x, trans.y, trans.z);
    _quat.set(rot.x, rot.y, rot.z, rot.w);
    const linvel = chassisRef.current.linvel();
    const angvel = chassisRef.current.angvel();

    // ── Input ──────────────────────────────────────────────────────────────────
    const joystick = getJoystickValues?.();

    // Read current key state synchronously (same as Ecctrl) — avoids stale-ref issues
    const keys = getKeys?.() ?? {};
    let forward = keys.forward ?? false;
    let backward = keys.backward ?? false;
    let leftward = keys.leftward ?? false;
    let rightward = keys.rightward ?? false;
    let sprinting = keys.run ?? false;
    let jumping = keys.jump ?? false;
    const braking = keys.action2 ?? false;
    let handbraking = keys.action4 ?? false;

    if (joystick?.joystickDis > 0) {
      const jx = Math.cos(joystick.joystickAng);
      const jy = Math.sin(joystick.joystickAng);
      if (jy > 0.3) forward = true;
      if (jy < -0.3) backward = true;
      if (jx > 0.3) rightward = true;
      if (jx < -0.3) leftward = true;
    }
    jumping = jumping || joystick?.button1Pressed || false;
    sprinting = sprinting || joystick?.button2Pressed || false;
    handbraking = handbraking || joystick?.button3Pressed || false;

    // Only drive when someone is in the car
    const isActive = standalone || mounted;
    const steerInput = isActive ? (leftward ? 1 : rightward ? -1 : 0) : 0;
    const driveInput = forward ? 1 : backward ? -1 : 0;
    sprintingRef.current = isActive && sprinting && driveInput > 0;

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
    // Keep the driving basis on the ground plane so landing roll/pitch from the
    // wheel colliders cannot turn vertical impact velocity into horizontal kick.
    _fwd.set(0, 0, -1).applyQuaternion(_quat);
    _fwd.y = 0;
    if (_fwd.lengthSq() < 1e-6) {
      _fwd.set(0, 0, -1);
    } else {
      _fwd.normalize();
    }
    _right.set(-_fwd.z, 0, _fwd.x);
    forwardSpeedRef.current = _fwd.x * linvel.x + _fwd.z * linvel.z;

    let steerDirection = 1;
    if (Math.abs(forwardSpeedRef.current) > 0.1) {
      steerDirection = forwardSpeedRef.current >= 0 ? 1 : -1;
    } else if (driveInput !== 0) {
      steerDirection = driveInput > 0 ? 1 : -1;
    }
    const oppositeThrottleBrake =
      (driveInput < 0 && forwardSpeedRef.current > 0.25) ||
      (driveInput > 0 && forwardSpeedRef.current < -0.25);
    const speedAbs = Math.abs(forwardSpeedRef.current);
    const brakePressed = isActive && (braking || oppositeThrottleBrake);
    const handbrakePressed = isActive && handbraking;
    const driftActive = handbrakePressed && speedAbs > driftMinSpeed;
    const jumpRequested = isActive && jumping;
    reversingRef.current = isActive && driveInput < 0 && !oppositeThrottleBrake;

    // ── Ground detection via downcast ray (same pattern as Ecctrl canJump) ──────
    // Resolve current-frame jump eligibility before applying any ground-only car
    // forces so hold-to-jump does not add extra throttle on the launch frame.
    const rayOrigin = { x: trans.x, y: trans.y, z: trans.z };
    const rayDir = { x: 0, y: -1, z: 0 };
    const ray = new rapier.Ray(rayOrigin, rayDir);
    const jumpRayHit = world.castRay(
      ray,
      0.55,
      true,
      undefined,
      undefined,
      undefined,
      chassisRef.current
    );
    let wheelGrounded = false;
    WHEEL_CONTACT_OFFSETS.forEach(([wheelX, wheelY, wheelZ]) => {
      _wheelProbePos
        .set(wheelX, wheelY, wheelZ)
        .applyQuaternion(_quat)
        .add(_pos);

      const wheelRay = new rapier.Ray(
        {
          x: _wheelProbePos.x,
          y: _wheelProbePos.y,
          z: _wheelProbePos.z,
        },
        rayDir
      );
      const wheelRayHit = world.castRay(
        wheelRay,
        0.5,
        true,
        undefined,
        undefined,
        undefined,
        chassisRef.current
      );
      if (wheelRayHit && wheelRayHit.timeOfImpact < 0.5) {
        wheelGrounded = true;
      }
    });

    const currentCanJump =
      !!(jumpRayHit && jumpRayHit.timeOfImpact < 0.55) || wheelGrounded;
    canJumpRef.current = currentCanJump;

    // ── Steering torque (ground only — in-air steer torque causes tumbling) ─────
    if (currentCanJump) {
      chassisRef.current.applyTorqueImpulse(
        {
          x: 0,
          y: steerAngleRef.current * steerTorqueMult * steerDirection * delta,
          z: 0,
        },
        true
      );
      if (driftActive && steerInput !== 0) {
        const driftSpeedFactor = Math.min(
          speedAbs / Math.max(maxThrottle, 0.01),
          1.5
        );
        const driftYawDirection = steerInput * steerDirection;
        chassisRef.current.applyTorqueImpulse(
          {
            x: 0,
            y: driftYawDirection * handbrakeYawBoost * driftSpeedFactor * delta,
            z: 0,
          },
          true
        );

        const driftKickImpulse =
          chassisRef.current.mass() *
          handbrakeSideKick *
          driftSpeedFactor *
          delta;
        chassisRef.current.applyImpulse(
          {
            x: _right.x * driftYawDirection * driftKickImpulse,
            y: 0,
            z: _right.z * driftYawDirection * driftKickImpulse,
          },
          true
        );
      }
    }

    // ── Throttle ───────────────────────────────────────────────────────────────
    if (isActive && currentCanJump) {
      if (brakePressed) {
        const brakeNeeded =
          -forwardSpeedRef.current / Math.max(brakeAccelTime, delta);
        const brakeImpulse = chassisRef.current.mass() * brakeNeeded * delta;
        _impulse.copy(_fwd).multiplyScalar(brakeImpulse);
        chassisRef.current.applyImpulse(
          { x: _impulse.x, y: 0, z: _impulse.z },
          true
        );
      } else if (driveInput !== 0) {
        const targetSpeed =
          driveInput * maxThrottle * (sprinting ? sprintMult : 1);
        const currentForwardSpeed = _fwd.x * linvel.x + _fwd.z * linvel.z;
        const accelTime = Math.max(driveAccelTime, delta);
        const accelNeeded = (targetSpeed - currentForwardSpeed) / accelTime;
        const driveImpulse =
          chassisRef.current.mass() *
          accelNeeded *
          delta *
          (driftActive ? handbrakeDriveMult : 1);

        _impulse.copy(_fwd).multiplyScalar(driveImpulse);
        chassisRef.current.applyImpulse(
          { x: _impulse.x, y: 0, z: _impulse.z },
          true
        );
      } else if (driftActive) {
        const driftBleedImpulse =
          chassisRef.current.mass() *
          -forwardSpeedRef.current *
          handbrakeSpeedBleed *
          delta;

        _impulse.copy(_fwd).multiplyScalar(driftBleedImpulse);
        chassisRef.current.applyImpulse(
          { x: _impulse.x, y: 0, z: _impulse.z },
          true
        );
      }
    }

    const recoveryRayHit = world.castRay(
      ray,
      0.95,
      true,
      undefined,
      undefined,
      undefined,
      chassisRef.current
    );

    // Once the car is clearly inverted and close to the ground, bias it back
    // toward the wheels instead of letting the flat roof settle stably.
    _up.set(0, 1, 0).applyQuaternion(_quat);
    const upDot = _up.dot(_worldUp);
    const groundedForRecovery = !!(
      recoveryRayHit && recoveryRayHit.timeOfImpact < 0.95
    );
    const upsideDown = upDot < selfRightUpDot;

    if (groundedForRecovery && upsideDown) {
      upsideTimeRef.current += delta;
    } else {
      upsideTimeRef.current = 0;
    }

    if (groundedForRecovery && upsideTimeRef.current >= selfRightDelay) {
      const heading = Math.atan2(-_fwd.x, -_fwd.z);
      _parentWorldQuat.setFromAxisAngle(_worldUp, heading);
      const recoveryLift = THREE.MathUtils.clamp(selfRightLift, 0.12, 0.55);
      const preservedYawSpin =
        THREE.MathUtils.clamp(angvel.y, -2, 2) *
        THREE.MathUtils.clamp(0.2 - selfRightSpinDamping * 0.01, 0, 0.2);
      const preservedSpeed = THREE.MathUtils.clamp(
        Math.hypot(linvel.x, linvel.z),
        0,
        selfRightMaxSpeed
      );

      chassisRef.current.setRotation(
        {
          x: _parentWorldQuat.x,
          y: _parentWorldQuat.y,
          z: _parentWorldQuat.z,
          w: _parentWorldQuat.w,
        },
        true
      );
      chassisRef.current.setTranslation(
        { x: trans.x, y: trans.y + recoveryLift, z: trans.z },
        true
      );
      chassisRef.current.setAngvel({ x: 0, y: preservedYawSpin, z: 0 }, true);
      chassisRef.current.setLinvel(
        {
          x: _fwd.x * preservedSpeed * 0.35,
          y: Math.max(linvel.y, 0),
          z: _fwd.z * preservedSpeed * 0.35,
        },
        true
      );
      upsideTimeRef.current = 0;
    }

    if (jumpRequested && currentCanJump) {
      chassisRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      chassisRef.current.setLinvel(
        { x: linvel.x, y: jumpVel, z: linvel.z },
        true
      );
    }

    // ── Lateral slip damping (always — keeps car from sliding on slopes) ───────
    const lateralVel = _right.x * linvel.x + _right.z * linvel.z;
    const lateralGripMult = driftActive ? handbrakeGripMult : 1;
    const lateralGrip = lateralDampingC * lateralGripMult;
    if (Math.abs(lateralVel) > 0.01) {
      chassisRef.current.applyImpulse(
        {
          x: -_right.x * lateralVel * lateralGrip,
          y: 0,
          z: -_right.z * lateralVel * lateralGrip,
        },
        true
      );
    }

    // ── Teleport kinematic capsule to seat each frame so it follows the car ──────
    // seatOffsetY clamped to 1.2 min so capsule bottom (offset - 0.65) stays
    // above the car top collider (0.3 half-height) with ~0.25 m clearance.
    if (!standalone && mountedRef.current && ecctrlRef?.current) {
      const safeY = Math.max(seatOffsetY, 1.2);

      if (chassisGroupRef.current) {
        chassisGroupRef.current.getWorldPosition(_visualPos);
        chassisGroupRef.current.getWorldQuaternion(_visualQuat);
      } else {
        _visualPos.copy(_pos);
        _visualQuat.copy(_quat);
      }

      _seatPos
        .set(0, safeY, seatOffsetZ)
        .applyQuaternion(_visualQuat)
        .add(_visualPos);
      ecctrlRef.current.setPosition(_seatPos);

      const riderGroup = ecctrlRef.current.group;
      if (riderGroup) {
        riderGroup.position.set(0, safeY, seatOffsetZ);
        _visualFwd.set(0, 0, -1).applyQuaternion(_visualQuat);
        const riderParent = riderGroup.parent;
        if (riderParent) {
          riderParent.getWorldQuaternion(_parentWorldQuat);
          _localFwd.copy(_visualFwd).applyQuaternion(_parentWorldQuat.invert());
        } else {
          _localFwd.copy(_visualFwd);
        }

        _localFwd.y = 0;
        if (_localFwd.lengthSq() > 1e-6) {
          _localFwd.normalize();
          ecctrlRef.current.setCharacterRotationOnY(
            Math.atan2(_localFwd.x, _localFwd.z)
          );
        }
      }
    }

    // ── Proximity detection ───────────────────────────────────────────────────
    if (!standalone && !mountedRef.current && ecctrlRef?.current?.group) {
      ecctrlRef.current.group.getWorldPosition(_playerPos);
      nearPlayerRef.current = _pos.distanceTo(_playerPos) < MOUNT_RADIUS;
    }

    // ── Follow-cam (standalone only) ───────────────────────────────────────────
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
      ccd
      userData={{ excludeEcctrlRay: true }}
    >
      {/*
       * Main chassis body — lighter upper mass aligned with the visible shell.
       * Raised so wheel spheres below are still the primary terrain contact.
       * half-extents: [x=0.65, y=0.18, z=1.2], offset +0.15 up
       */}
      <CuboidCollider
        args={[0.65, 0.18, 1.2]}
        position={[0, 0.28, 0.22]}
        mass={4}
        friction={0}
        frictionCombineRule={CoefficientCombineRule.Min}
      />
      {/*
       * Low ballast collider — keeps the center of mass near the axle plane so
       * the car is much less likely to roll fully onto its roof on rough terrain.
       * It sits above the wheel bottoms, so wheels still touch first.
       */}
      <CuboidCollider
        args={[0.5, 0.08, 0.85]}
        position={[0, -0.02, 0.22]}
        mass={8}
        friction={0}
        frictionCombineRule={CoefficientCombineRule.Min}
      />
      {/*
       * Roof roll-cage balls — when the car lands upside down these become the
       * first contact points, creating a narrow ridge instead of a broad flat
       * roof so the body naturally rocks back toward the wheels.
       */}
      {[
        [0, 0.54, -0.35],
        [0, 0.54, 0.22],
        [0, 0.54, 0.95],
      ].map(([rx, ry, rz], i) => (
        <BallCollider
          // eslint-disable-next-line react/no-array-index-key
          key={`roof-${i}`}
          args={[0.18]}
          position={[rx, ry, rz]}
          mass={0}
          friction={0}
          frictionCombineRule={CoefficientCombineRule.Min}
        />
      ))}
      {/*
       * Wheel spheres — rounded contact points so the car rolls over
       * rough terrain instead of catching flat edges.
       * Positions derived from the model group transform (Rx-90°, scale 0.257):
       *   FL (-0.810, 0.116, -0.835)  FR (0.810, 0.116, -0.835)
       *   RL (-0.835, 0.116,  1.272)  RR (0.835, 0.116,  1.272)
       */}
      {WHEEL_CONTACT_OFFSETS.map(([wx, wy, wz], i) => (
        <BallCollider
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          args={[WHEEL_CONTACT_RADIUS]}
          position={[wx, wy, wz]}
          mass={0}
          friction={0}
          frictionCombineRule={CoefficientCombineRule.Min}
        />
      ))}

      <group ref={chassisGroupRef}>
        <RcCar
          steerAngleRef={steerAngleRef}
          forwardSpeedRef={forwardSpeedRef}
          sprintingRef={sprintingRef}
          reversingRef={reversingRef}
        />
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
