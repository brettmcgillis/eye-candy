import React, { memo, useMemo, useRef } from 'react';

import { KeyboardControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { Ecctrl } from '@modules/ecctrl';

import GhostPlayer from './GhostPlayer';

const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'run', keys: ['Shift'] },
];

const worldPosition = new THREE.Vector3();
const worldVelocity = new THREE.Vector3();
const inverseQuaternion = new THREE.Quaternion();

// Ecctrl-driven ghost. Every frame the character feeds the shared tracker
// (world streaming, grass bend uniform, sky/mountain following) and the
// ghost's cloth input: travel reads as wind blowing the sheet backward in
// the ghost's local space, vertical speed triggers the jump squash.
//
// Ecctrl's imperative handle is not the raw rapier body — it exposes the
// yawed character model as `group` plus setters. Position comes from the
// group's world transform; velocity is a finite difference of it.
function Player({ config, tracker, world }) {
  const ecctrlRef = useRef(null);
  const ghostGroupRef = useRef(null);
  const prevPositionRef = useRef(null);
  const animationInputRef = useRef({
    windDirX: 0,
    windDirZ: 0,
    windStrength: 0,
    jumpTriggered: false,
  });

  const spawn = useMemo(() => [0, world.sampleHeight(0, 0) + 3, 0], []);

  useFrame((_, delta) => {
    const group = ecctrlRef.current?.group;
    if (!group) return;

    group.getWorldPosition(worldPosition);
    tracker.position.copy(worldPosition);
    tracker.ghostPosition.value.copy(worldPosition);

    // Finite-difference velocity (the handle hides the rapier body).
    const dt = Math.max(delta, 1e-4);
    if (!prevPositionRef.current) {
      prevPositionRef.current = worldPosition.clone();
    }
    const prev = prevPositionRef.current;
    tracker.velocity
      .set(
        (worldPosition.x - prev.x) / dt,
        (worldPosition.y - prev.y) / dt,
        (worldPosition.z - prev.z) / dt
      )
      .clampLength(0, 40);
    prev.copy(worldPosition);

    const input = animationInputRef.current;
    const speed = Math.hypot(tracker.velocity.x, tracker.velocity.z);
    const topSpeed = Math.max(config.maxVelLimit * config.sprintMult, 0.01);
    input.windStrength = Math.min(speed / topSpeed, 1);
    input.jumpTriggered = tracker.velocity.y > 2;

    const ghostGroup = ghostGroupRef.current;
    if (speed > 0.05 && ghostGroup) {
      // Cloth wind opposes travel, expressed in the ghost's local frame
      // (Ecctrl yaws the model group to face movement).
      ghostGroup.getWorldQuaternion(inverseQuaternion).invert();
      worldVelocity
        .set(-tracker.velocity.x / speed, 0, -tracker.velocity.z / speed)
        .applyQuaternion(inverseQuaternion);
      input.windDirX = worldVelocity.x;
      input.windDirZ = worldVelocity.z;
    } else {
      input.windStrength = 0;
    }
  });

  return (
    <KeyboardControls map={keyboardMap}>
      <Ecctrl
        ref={ecctrlRef}
        animated
        // WebGPU frame pacing is spikier than WebGL; the auto-balance
        // spring overshoots on irregular deltas and shakes the capsule
        // (which throws the cloth off its colliders). The ghost is a
        // floating blob — it doesn't need balancing at all.
        autoBalance={false}
        camInitDis={config.camInitDis}
        camLerpMult={25}
        camMaxDis={config.camMaxDis}
        camMinDis={config.camMinDis}
        capsuleHalfHeight={0.35 * config.ghostScale}
        capsuleRadius={0.3 * config.ghostScale}
        fallingGravityScale={2.5}
        floatHeight={config.floatHeight * config.ghostScale}
        jumpVel={config.jumpVel}
        maxVelLimit={config.maxVelLimit}
        position={spawn}
        sprintMult={config.sprintMult}
        turnSpeed={15}
        turnVelMultiplier={0.2}
      >
        <group ref={ghostGroupRef} scale={config.ghostScale}>
          <GhostPlayer animationInputRef={animationInputRef} config={config} />
        </group>
      </Ecctrl>
    </KeyboardControls>
  );
}

export default memo(Player);
