/* eslint-disable no-nested-ternary */
import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import { useBeforePhysicsStep } from '@react-three/rapier';

import { DICE_CONFIGS } from '../presets/QuinnsDice.sceneSettings';

const DIE_IDS = DICE_CONFIGS.map((config) => config.id);
const ZERO_VEL = { x: 0, y: 0, z: 0 };
const GRAVITY_IMPULSE = { x: 0, y: -0.1, z: 0 };
const BOUNDARY_PADDING = 0.65;
const SETTLE_DISTANCE_SQ = 0.0009;
const SETTLE_SPEED_SQ = 0.0009;
const PHYSICS_DT = 1 / 60;

function computePhysicsParams(
  returnStrength,
  linearDamping,
  maxImpulse,
  boundsWidth,
  boundsHeight,
  boundsDepth
) {
  const baseFollow = Math.max(0, returnStrength) * 2.2;
  const followRate = Math.max(0.4, baseFollow);
  const dampingRate = Math.max(0.2, linearDamping * 0.55);
  const maxReturnSpeed = Math.max(0.2, maxImpulse * 10);
  return {
    followRate,
    blend: 1 - Math.exp(-followRate * PHYSICS_DT),
    dampingFactor: Math.exp(-dampingRate * PHYSICS_DT),
    maxReturnSpeed,
    maxReturnSpeedSq: maxReturnSpeed * maxReturnSpeed,
    xLimit: Math.max(0.2, boundsWidth / 2 - BOUNDARY_PADDING),
    yLimit: Math.max(0.2, boundsHeight / 2 - BOUNDARY_PADDING),
    zLimit: Math.max(0.2, boundsDepth / 2 - BOUNDARY_PADDING),
    correctionSpeed: Math.max(1.8, maxReturnSpeed * 0.7),
  };
}

const DicePhysicsDriver = React.memo(function DicePhysicsDriver({
  dieRefMap,
  detachedDieIdRef,
  rollingDieIdRef,
  physicsEnabled,
  returnStrength,
  linearDamping,
  maxImpulse,
  boundsWidth,
  boundsHeight,
  boundsDepth,
  targetX,
  targetY,
  targetZ,
}) {
  const velocityRef = useRef(new THREE.Vector3());
  const targetVelocityRef = useRef(new THREE.Vector3());
  const correctedTranslationRef = useRef(new THREE.Vector3());
  const correctedVelocityRef = useRef(new THREE.Vector3());
  const physicsParamsRef = useRef(null);

  // Recompute only when physics config props change — not on every step
  const physicsParams = useMemo(
    () =>
      computePhysicsParams(
        returnStrength,
        linearDamping,
        maxImpulse,
        boundsWidth,
        boundsHeight,
        boundsDepth
      ),
    [
      returnStrength,
      linearDamping,
      maxImpulse,
      boundsWidth,
      boundsHeight,
      boundsDepth,
    ]
  );
  // Write to ref synchronously so the physics callback always reads current values
  physicsParamsRef.current = physicsParams;

  useBeforePhysicsStep(() => {
    if (!physicsEnabled) return;

    const {
      followRate,
      blend,
      dampingFactor,
      maxReturnSpeed,
      maxReturnSpeedSq,
      xLimit,
      yLimit,
      zLimit,
      correctionSpeed,
    } = physicsParamsRef.current;

    const velocity = velocityRef.current;
    const targetVelocity = targetVelocityRef.current;
    const correctedTranslation = correctedTranslationRef.current;
    const correctedVelocity = correctedVelocityRef.current;

    for (let i = 0; i < DIE_IDS.length; i += 1) {
      const id = DIE_IDS[i];
      const body = dieRefMap[id]?.current;
      if (body) {
        const translation = body.translation();
        const linearVelocity = body.linvel();
        const clampedX = THREE.MathUtils.clamp(translation.x, -xLimit, xLimit);
        const clampedY = THREE.MathUtils.clamp(translation.y, -yLimit, yLimit);
        const clampedZ = THREE.MathUtils.clamp(translation.z, -zLimit, zLimit);
        const correctedX = clampedX !== translation.x;
        const correctedY = clampedY !== translation.y;
        const correctedZ = clampedZ !== translation.z;

        if (correctedX || correctedY || correctedZ) {
          correctedTranslation.set(clampedX, clampedY, clampedZ);
          body.setTranslation(correctedTranslation, false);

          correctedVelocity.set(
            correctedX
              ? -Math.sign(translation.x) *
                  Math.max(correctionSpeed, Math.abs(linearVelocity.x) * 0.35)
              : linearVelocity.x,
            correctedY
              ? -Math.sign(translation.y) *
                  Math.max(correctionSpeed, Math.abs(linearVelocity.y) * 0.35)
              : linearVelocity.y,
            correctedZ
              ? -Math.sign(translation.z) *
                  Math.max(correctionSpeed, Math.abs(linearVelocity.z) * 0.35)
              : linearVelocity.z
          );
          body.setLinvel(correctedVelocity, false);
        }

        if (detachedDieIdRef.current !== id) {
          const dx = targetX - clampedX;
          const dy = targetY - clampedY;
          const dz = targetZ - clampedZ;
          const displacementSq = dx * dx + dy * dy + dz * dz;
          const velocitySq =
            linearVelocity.x ** 2 +
            linearVelocity.y ** 2 +
            linearVelocity.z ** 2;

          if (
            displacementSq < SETTLE_DISTANCE_SQ &&
            velocitySq < SETTLE_SPEED_SQ
          ) {
            body.setLinvel(ZERO_VEL, false);
          } else {
            targetVelocity.set(dx, dy, dz).multiplyScalar(followRate);
            if (targetVelocity.lengthSq() > maxReturnSpeedSq) {
              targetVelocity.setLength(maxReturnSpeed);
            }

            velocity.set(linearVelocity.x, linearVelocity.y, linearVelocity.z);
            velocity.lerp(targetVelocity, blend).multiplyScalar(dampingFactor);
            body.setLinvel(velocity, false);
          }
        }
      }
    }

    if (rollingDieIdRef.current) {
      const rollingBody = dieRefMap[rollingDieIdRef.current]?.current;
      if (rollingBody) {
        rollingBody.applyImpulse(GRAVITY_IMPULSE, false);
      }
    }
  });

  return null;
});

export default DicePhysicsDriver;
