import React, { useCallback, useEffect, useId, useMemo, useRef } from 'react';

import { CuboidCollider, RigidBody } from '@react-three/rapier';

import * as THREE from 'three';

import {
  DUMPSTER_LEFT_LID_PIVOT_POSITION,
  DUMPSTER_RIGHT_LID_PIVOT_POSITION,
  DumpsterLeftLid,
  DumpsterRightLid,
  DumpsterShell,
} from '@elements/dumpster/Dumpster';

import useTrashBlasterStore from '../hooks/useTrashBlasterStore';

const DEG = Math.PI / 180;
export const DUMPSTER_LID_MIN_ANGLE = -159 * DEG;
export const DUMPSTER_LID_MAX_ANGLE = 105 * DEG;
export const DUMPSTER_LID_INITIAL_ANGLE = -159 * DEG;
const DUMPSTER_LID_ANGLE_RANGE = [
  DUMPSTER_LID_MIN_ANGLE,
  DUMPSTER_LID_MAX_ANGLE,
];

// Approximate open-mouth cavity between the lid hinges (derived from the lid
// pivot positions below). Rough by nature — nudge live with Physics > Debug
// enabled while framing the "Ignition" shot.
const DUMPSTER_MOUTH_SENSOR = Object.freeze({
  halfExtents: [1.85, 0.1, 0.85],
  position: [0, 1.5, -0.05],
});

function toScaleVector(scale) {
  if (Array.isArray(scale)) {
    return scale;
  }

  return [scale, scale, scale];
}

function transformDumpsterPivotToScene([x, y, z], [scaleX, scaleY, scaleZ]) {
  return [x * 0.01 * scaleX, z * 0.01 * scaleY, -y * 0.01 * scaleZ];
}

function clampLidAngle(angle, [minAngle, maxAngle]) {
  return Math.min(maxAngle, Math.max(minAngle, angle));
}

function getLidWorldRotation(lidAngle, itemRotation) {
  const bodyQuaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(...itemRotation)
  );
  const lidQuaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(lidAngle, 0, 0)
  );
  const worldQuaternion = bodyQuaternion.multiply(lidQuaternion);

  return {
    x: worldQuaternion.x,
    y: worldQuaternion.y,
    z: worldQuaternion.z,
    w: worldQuaternion.w,
  };
}

function setLidBodyAngle(body, lidAngle, itemRotation) {
  if (!body) {
    return;
  }

  body.setRotation(getLidWorldRotation(lidAngle, itemRotation), true);
  body.wakeUp?.();
}

export default function ArticulatedDumpster({
  item,
  onCollisionEnter,
  igniteOnHit,
  onIgnite,
}) {
  const registerInteractiveTarget = useTrashBlasterStore(
    (s) => s.registerInteractiveTarget
  );
  const unregisterInteractiveTarget = useTrashBlasterStore(
    (s) => s.unregisterInteractiveTarget
  );
  const cleanupNonce = useTrashBlasterStore((s) => s.cleanupNonce);
  const {
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = 1,
    componentProps = {},
  } = item;

  const {
    frontLeftWheelRotation = Math.PI,
    frontRightWheelRotation = 0,
    rearLeftWheelRotation = Math.PI,
    rearRightWheelRotation = 0,
    leftLidRotation = DUMPSTER_LID_INITIAL_ANGLE,
    rightLidRotation = DUMPSTER_LID_INITIAL_ANGLE,
  } = componentProps;
  const leftLidInitialRotation = clampLidAngle(
    leftLidRotation,
    DUMPSTER_LID_ANGLE_RANGE
  );
  const rightLidInitialRotation = clampLidAngle(
    rightLidRotation,
    DUMPSTER_LID_ANGLE_RANGE
  );
  const leftLidAngleRef = useRef(leftLidInitialRotation);
  const rightLidAngleRef = useRef(rightLidInitialRotation);
  const instanceId = useId();

  const scaleVector = useMemo(() => toScaleVector(scale), [scale]);
  const leftLidPivotPosition = useMemo(
    () =>
      transformDumpsterPivotToScene(
        DUMPSTER_LEFT_LID_PIVOT_POSITION,
        scaleVector
      ),
    [scaleVector]
  );
  const rightLidPivotPosition = useMemo(
    () =>
      transformDumpsterPivotToScene(
        DUMPSTER_RIGHT_LID_PIVOT_POSITION,
        scaleVector
      ),
    [scaleVector]
  );

  const handleMouthIntersection = useCallback(
    (payload) => {
      if (!igniteOnHit) {
        return;
      }

      const { isTrashProjectile, isActiveThrowable, isFlammableTrash } =
        payload?.other?.rigidBody?.userData ?? {};

      if (isFlammableTrash || (isTrashProjectile && isActiveThrowable)) {
        onIgnite?.();
      }
    },
    [igniteOnHit, onIgnite]
  );

  const dumpsterBodyRef = useRef(null);
  const leftLidRef = useRef(null);
  const rightLidRef = useRef(null);
  const leftLidDragRootRef = useRef(null);
  const rightLidDragRootRef = useRef(null);

  useEffect(() => {
    leftLidAngleRef.current = leftLidInitialRotation;
  }, [leftLidInitialRotation]);

  useEffect(() => {
    rightLidAngleRef.current = rightLidInitialRotation;
  }, [rightLidInitialRotation]);

  useEffect(() => {
    // Hinge-aware lid drag: the lid rotates about its hinge axis so that the
    // grab point follows the pointer's projection onto the hinge plane.
    // This matches how a real lid feels — wherever you grab it, that point
    // tracks under the cursor.
    const buildLidSession =
      ({ angleRef: lidAngleRef, bodyRef }) =>
      ({ intersection, camera, domElement }) => {
        const startAngle = lidAngleRef.current;

        // Hinge axis = parent group's local X axis in world space.
        // (Rotation around X preserves X, so the lid's current angle doesn't
        // affect the hinge direction.)
        const hingeAxis = new THREE.Vector3(1, 0, 0)
          .applyEuler(new THREE.Euler(...rotation))
          .normalize();

        // Pivot = world position of the lid's kinematic body.
        const bodyTranslation = bodyRef.current?.translation();
        const pivotWorld = bodyTranslation
          ? new THREE.Vector3(
              bodyTranslation.x,
              bodyTranslation.y,
              bodyTranslation.z
            )
          : new THREE.Vector3();

        // Reference radial = vector from pivot to initial hit point, projected
        // onto the hinge plane.
        const refRadial = intersection.point.clone().sub(pivotWorld);
        refRadial.addScaledVector(hingeAxis, -refRadial.dot(hingeAxis));

        const session = {
          kind: 'lid',
          startAngle,
          angleRef: lidAngleRef,
          lastDelta: 0,
          hasValidReference: refRadial.lengthSq() >= 1e-8,
        };

        if (session.hasValidReference) {
          refRadial.normalize();
        }

        const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
          hingeAxis,
          pivotWorld
        );
        const raycaster = new THREE.Raycaster();
        const hit = new THREE.Vector3();
        const curRadial = new THREE.Vector3();
        const cross = new THREE.Vector3();
        const ndc = new THREE.Vector2();

        session.getDraggedAngle = (nextClientX, nextClientY) => {
          if (!session.hasValidReference) {
            return startAngle;
          }

          const bounds = domElement.getBoundingClientRect();
          ndc.set(
            ((nextClientX - bounds.left) / bounds.width) * 2 - 1,
            -(((nextClientY - bounds.top) / bounds.height) * 2 - 1)
          );

          raycaster.setFromCamera(ndc, camera);

          if (!raycaster.ray.intersectPlane(plane, hit)) {
            // Ray is parallel to hinge plane — hold last valid angle.
            return clampLidAngle(
              startAngle + session.lastDelta,
              DUMPSTER_LID_ANGLE_RANGE
            );
          }

          curRadial.copy(hit).sub(pivotWorld);
          curRadial.addScaledVector(hingeAxis, -curRadial.dot(hingeAxis));

          if (curRadial.lengthSq() < 1e-8) {
            return clampLidAngle(
              startAngle + session.lastDelta,
              DUMPSTER_LID_ANGLE_RANGE
            );
          }

          curRadial.normalize();
          cross.crossVectors(refRadial, curRadial);

          let delta = Math.atan2(
            cross.dot(hingeAxis),
            refRadial.dot(curRadial)
          );

          // Unwrap relative to the previous delta so a drag can travel more
          // than 180° without flipping sign at the atan2 branch cut.
          const prev = session.lastDelta;
          while (delta - prev > Math.PI) {
            delta -= 2 * Math.PI;
          }
          while (delta - prev < -Math.PI) {
            delta += 2 * Math.PI;
          }
          session.lastDelta = delta;

          return clampLidAngle(startAngle + delta, DUMPSTER_LID_ANGLE_RANGE);
        };

        session.applyDraggedAngle = (angle) => {
          // eslint-disable-next-line no-param-reassign
          lidAngleRef.current = angle;
          setLidBodyAngle(bodyRef.current, angle, rotation);
        };

        return session;
      };

    const leftTargetId = `${instanceId}-left-lid`;
    const rightTargetId = `${instanceId}-right-lid`;

    registerInteractiveTarget(leftTargetId, {
      getObject: () => leftLidDragRootRef.current,
      buildSession: buildLidSession({
        angleRef: leftLidAngleRef,
        bodyRef: leftLidRef,
      }),
    });
    registerInteractiveTarget(rightTargetId, {
      getObject: () => rightLidDragRootRef.current,
      buildSession: buildLidSession({
        angleRef: rightLidAngleRef,
        bodyRef: rightLidRef,
      }),
    });

    return () => {
      unregisterInteractiveTarget(leftTargetId);
      unregisterInteractiveTarget(rightTargetId);
    };
  }, [
    instanceId,
    registerInteractiveTarget,
    rotation,
    unregisterInteractiveTarget,
  ]);

  useEffect(() => {
    leftLidAngleRef.current = leftLidInitialRotation;
    rightLidAngleRef.current = rightLidInitialRotation;

    setLidBodyAngle(leftLidRef.current, leftLidInitialRotation, rotation);
    setLidBodyAngle(rightLidRef.current, rightLidInitialRotation, rotation);
  }, [cleanupNonce, leftLidInitialRotation, rightLidInitialRotation, rotation]);

  return (
    <group position={position} rotation={rotation}>
      <RigidBody
        ref={dumpsterBodyRef}
        type="fixed"
        colliders="trimesh"
        friction={1.1}
        restitution={0.05}
        onCollisionEnter={onCollisionEnter}
      >
        <DumpsterShell
          frontLeftWheelRotation={frontLeftWheelRotation}
          frontRightWheelRotation={frontRightWheelRotation}
          rearLeftWheelRotation={rearLeftWheelRotation}
          rearRightWheelRotation={rearRightWheelRotation}
          scale={scale}
        />
        <CuboidCollider
          args={DUMPSTER_MOUTH_SENSOR.halfExtents}
          position={DUMPSTER_MOUTH_SENSOR.position}
          sensor
          onIntersectionEnter={handleMouthIntersection}
        />
      </RigidBody>

      <RigidBody
        ref={leftLidRef}
        type="kinematicPosition"
        colliders="hull"
        position={leftLidPivotPosition}
        rotation={[leftLidInitialRotation, 0, 0]}
        friction={1.1}
        restitution={0.03}
        ccd
        onCollisionEnter={onCollisionEnter}
      >
        <group ref={leftLidDragRootRef}>
          <DumpsterLeftLid pivotPosition={[0, 0, 0]} scale={scale} />
        </group>
      </RigidBody>

      <RigidBody
        ref={rightLidRef}
        type="kinematicPosition"
        colliders="hull"
        position={rightLidPivotPosition}
        rotation={[rightLidInitialRotation, 0, 0]}
        friction={1.1}
        restitution={0.03}
        ccd
        onCollisionEnter={onCollisionEnter}
      >
        <group ref={rightLidDragRootRef}>
          <DumpsterRightLid pivotPosition={[0, 0, 0]} scale={scale} />
        </group>
      </RigidBody>
    </group>
  );
}
