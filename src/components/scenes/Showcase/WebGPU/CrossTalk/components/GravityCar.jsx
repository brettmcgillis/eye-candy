import * as THREE from 'three/webgpu';

import React, { memo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import RcCar from '../../../../../elements/models/rcCar/RcCar';

// RideableRcCar.jsx establishes the model's own conventions this wrapper
// has to match: forward is local -Z (`_fwd.set(0, 0, -1)`), up is local +Y,
// and steerAngleRef is clamped to roughly ±0.45 rad there — reused as this
// scene's own steering range.
const MAX_STEER = 0.45;
// Below this many px of frame-to-frame movement, treat the car as
// stationary — avoids atan2(0, 0) heading jitter when it's briefly at rest.
const MIN_MOVE_DIST = 0.02;
// Per-second catch-up rate for heading easing toward the raw travel
// direction — not instant, so a bounce reads as "the car turns to face its
// new direction" rather than snapping.
const HEADING_EASE = 10;
// Converts the heading's own angular velocity (rad/s) into a wheel-turn
// angle (rad) — large right after a sharp direction change (a bounce),
// settling to ~0 (straight) once heading has caught up, same shape as a
// real car correcting its line.
const STEER_GAIN = 0.12;
const STEER_RELAX = 8;

function shortestAngleDiff(target, current) {
  let diff = (target - current) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

// The shared RC car, positioned/oriented imperatively each frame from
// useGravityBall's positionRef (a ref, not state — see
// scene-performance-checklist.md). The underlying physics (utils/
// gravityRooms.js) is unchanged: still a point mass bouncing between rooms
// under gravity. Heading and steering are purely a rendering-layer read of
// that motion (frame-to-frame position deltas), not a new physics model —
// the car doesn't drive itself, it's reoriented to face wherever the
// existing ball physics is already taking it.
//
// Two nested fixed-axis rotations reorient the model from its native
// "stands upright on XZ ground, forward -Z" pose into this scene's flat XY
// pixel-space world (verified by hand: RotateX(+90°) then RotateZ(-90°)
// sends local forward (0,0,-1) to world (1,0,0) and local up (0,1,0) to
// world (0,0,1) — i.e. roof toward the camera, "forward" along scene +X
// when heading is 0, matching every other angle in this scene). The outer
// group then adds the live heading on top of that fixed baseline.
function GravityCar({ positionRef, scale }) {
  const groupRef = useRef(null);
  const headingRef = useRef(0);
  const steerAngleRef = useRef(0);
  const forwardSpeedRef = useRef(0);
  const prevPosRef = useRef(null);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const dt = Math.max(delta, 1e-4);
    const pos = positionRef.current;

    if (!prevPosRef.current) prevPosRef.current = { x: pos.x, y: pos.y };
    const dx = pos.x - prevPosRef.current.x;
    const dy = pos.y - prevPosRef.current.y;
    const dist = Math.hypot(dx, dy);

    if (dist > MIN_MOVE_DIST) {
      const targetHeading = Math.atan2(dy, dx);
      const step =
        shortestAngleDiff(targetHeading, headingRef.current) *
        Math.min(HEADING_EASE * dt, 1);
      headingRef.current += step;
      steerAngleRef.current = THREE.MathUtils.clamp(
        (step / dt) * STEER_GAIN,
        -MAX_STEER,
        MAX_STEER
      );
      // RcCar's wheel-spin formula (forwardSpeed / WHEEL_RADIUS) assumes
      // the model's own native unit scale, not this scene's pixel space —
      // dividing by `scale` converts back to that native scale so the
      // wheels' apparent spin rate matches how fast the car looks like
      // it's moving on screen, independent of the raw px/s magnitude.
      forwardSpeedRef.current = dist / dt / scale;
    } else {
      steerAngleRef.current *= 1 - Math.min(STEER_RELAX * dt, 1);
      forwardSpeedRef.current = 0;
    }

    prevPosRef.current.x = pos.x;
    prevPosRef.current.y = pos.y;

    group.position.set(pos.x, pos.y, 1);
    group.rotation.z = headingRef.current - Math.PI / 2;
  });

  return (
    <group ref={groupRef}>
      <group rotation={[Math.PI / 2, 0, 0]} scale={scale}>
        <RcCar
          forwardSpeedRef={forwardSpeedRef}
          steerAngleRef={steerAngleRef}
        />
      </group>
    </group>
  );
}

export default memo(GravityCar);
