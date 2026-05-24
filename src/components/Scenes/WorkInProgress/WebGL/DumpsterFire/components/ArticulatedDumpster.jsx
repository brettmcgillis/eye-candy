import * as THREE from 'three';

import React, { useEffect, useId, useMemo, useRef } from 'react';

import { RigidBody } from '@react-three/rapier';

import {
  DUMPSTER_LEFT_LID_PIVOT_POSITION,
  DUMPSTER_RIGHT_LID_PIVOT_POSITION,
  DumpsterLeftLid,
  DumpsterRightLid,
  DumpsterShell,
} from '../../../../../elements/dumpster/Dumpster';
import useTrashBlasterStore from '../hooks/useTrashBlasterStore';

const DEG = Math.PI / 180;
const DUMPSTER_LID_MIN_ANGLE = -180 * DEG;
const DUMPSTER_LID_MAX_ANGLE = 90 * DEG;
const DUMPSTER_LID_INITIAL_ANGLE = -180 * DEG;
const DUMPSTER_LID_ANGLE_RANGE = [
  DUMPSTER_LID_MIN_ANGLE,
  DUMPSTER_LID_MAX_ANGLE,
];
const LID_DRAG_RADIANS_PER_PIXEL = 0.01;
const LID_DRAG_DIRECTION_THRESHOLD_PX = 3;

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

export default function ArticulatedDumpster({ item, onCollisionEnter }) {
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
  } = componentProps;
  const leftLidInitialRotation = DUMPSTER_LID_INITIAL_ANGLE;
  const rightLidInitialRotation = DUMPSTER_LID_INITIAL_ANGLE;
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
    const buildLidSession =
      ({ angleRef: lidAngleRef, bodyRef }) =>
      ({ clientX, clientY }) => {
        const startAngle = lidAngleRef.current;
        const session = {
          kind: 'lid',
          startAngle,
          angleRef: lidAngleRef,
          dragDirection: null,
        };

        session.getDraggedAngle = (nextClientX, nextClientY) => {
          const dx = nextClientX - clientX;
          const dy = nextClientY - clientY;

          if (!session.dragDirection) {
            const distance = Math.hypot(dx, dy);

            if (distance < LID_DRAG_DIRECTION_THRESHOLD_PX) {
              return startAngle;
            }

            session.dragDirection = { x: dx / distance, y: dy / distance };
          }

          const signedDistance =
            dx * session.dragDirection.x + dy * session.dragDirection.y;

          return clampLidAngle(
            startAngle + signedDistance * LID_DRAG_RADIANS_PER_PIXEL,
            DUMPSTER_LID_ANGLE_RANGE
          );
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
