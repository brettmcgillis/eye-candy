import * as THREE from 'three';

import React, { useEffect, useMemo, useRef } from 'react';

import { RigidBody } from '@react-three/rapier';

import {
  DUMPSTER_LEFT_LID_PIVOT_POSITION,
  DUMPSTER_RIGHT_LID_PIVOT_POSITION,
  DumpsterLeftLid,
  DumpsterRightLid,
  DumpsterShell,
} from '../../../../../elements/dumpster/Dumpster';
import useTrashBlasterStore from '../hooks/useTrashBlasterStore';
import { SCENE_ROOT_POSITION } from '../utils/sceneData';
import {
  getNormalizedPointerPosition,
  getSceneItemKey,
} from '../utils/sceneUtils';

const DUMPSTER_LEFT_LID_CLOSED_ANGLE = 1.833;
const DUMPSTER_RIGHT_LID_CLOSED_ANGLE = Math.PI / 4;
const DUMPSTER_LID_HANDLE_LOCAL_OFFSET = [0, 0.3, 51.276];
const LID_DRAG_AXIS_PROBE_EPSILON = 0.08;
const LID_DRAG_RADIANS_PER_PIXEL = 0.01;
const LID_OCCLUSION_DISTANCE_EPSILON = 1e-3;

const sharedOcclusionRaycaster = new THREE.Raycaster();

function wrapToPi(angle) {
  let wrapped = angle;

  while (wrapped > Math.PI) wrapped -= Math.PI * 2;
  while (wrapped < -Math.PI) wrapped += Math.PI * 2;

  return wrapped;
}

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

function createLidAngleRange(closedAngle, openAngle) {
  const normalizedClosedAngle = wrapToPi(closedAngle);
  const normalizedOpenAngle = wrapToPi(openAngle);

  if (normalizedClosedAngle <= normalizedOpenAngle) {
    return [normalizedClosedAngle, normalizedOpenAngle];
  }

  return [normalizedOpenAngle, normalizedClosedAngle];
}

function getLidResetPose({ lidAngle, pivotPosition, position, rotation }) {
  const scenePosition = new THREE.Vector3(
    SCENE_ROOT_POSITION[0] + position[0],
    SCENE_ROOT_POSITION[1] + position[1],
    SCENE_ROOT_POSITION[2] + position[2]
  );
  const bodyQuaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(...rotation)
  );
  const lidQuaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(lidAngle, 0, 0)
  );
  const lidPosition = new THREE.Vector3(...pivotPosition)
    .applyQuaternion(bodyQuaternion)
    .add(scenePosition);
  const worldQuaternion = bodyQuaternion.clone().multiply(lidQuaternion);

  return {
    position: {
      x: lidPosition.x,
      y: lidPosition.y,
      z: lidPosition.z,
    },
    rotation: {
      x: worldQuaternion.x,
      y: worldQuaternion.y,
      z: worldQuaternion.z,
      w: worldQuaternion.w,
    },
  };
}

function getLidHandleWorldPoint({
  pivotPositionModel,
  lidAngle,
  scaleVector,
  position,
  rotation,
}) {
  const lidOffset = new THREE.Vector3(
    DUMPSTER_LID_HANDLE_LOCAL_OFFSET[0],
    DUMPSTER_LID_HANDLE_LOCAL_OFFSET[1],
    DUMPSTER_LID_HANDLE_LOCAL_OFFSET[2]
  ).applyEuler(new THREE.Euler(lidAngle, 0, 0));
  const sceneLocalPoint = new THREE.Vector3(
    ...transformDumpsterPivotToScene(
      [
        pivotPositionModel[0] + lidOffset.x,
        pivotPositionModel[1] + lidOffset.y,
        pivotPositionModel[2] + lidOffset.z,
      ],
      scaleVector
    )
  );

  return sceneLocalPoint
    .applyEuler(new THREE.Euler(...rotation))
    .add(
      new THREE.Vector3(
        SCENE_ROOT_POSITION[0] + position[0],
        SCENE_ROOT_POSITION[1] + position[1],
        SCENE_ROOT_POSITION[2] + position[2]
      )
    );
}

function projectWorldToClient(worldPoint, camera, domElement) {
  const bounds = domElement.getBoundingClientRect();
  const projected = worldPoint.clone().project(camera);

  return new THREE.Vector2(
    bounds.left + (projected.x + 1) * 0.5 * bounds.width,
    bounds.top + (1 - projected.y) * 0.5 * bounds.height
  );
}

function getLidScreenDragAxis({
  pivotPositionModel,
  startAngle,
  angleRange,
  scaleVector,
  position,
  rotation,
  camera,
  domElement,
}) {
  const startClientPoint = projectWorldToClient(
    getLidHandleWorldPoint({
      pivotPositionModel,
      lidAngle: startAngle,
      scaleVector,
      position,
      rotation,
    }),
    camera,
    domElement
  );
  const forwardAngle = clampLidAngle(
    startAngle + LID_DRAG_AXIS_PROBE_EPSILON,
    angleRange
  );

  if (Math.abs(forwardAngle - startAngle) > 1e-4) {
    const forwardAxis = projectWorldToClient(
      getLidHandleWorldPoint({
        pivotPositionModel,
        lidAngle: forwardAngle,
        scaleVector,
        position,
        rotation,
      }),
      camera,
      domElement
    ).sub(startClientPoint);

    if (forwardAxis.lengthSq() > 0.25) {
      return forwardAxis.normalize();
    }
  }

  const backwardAngle = clampLidAngle(
    startAngle - LID_DRAG_AXIS_PROBE_EPSILON,
    angleRange
  );

  if (Math.abs(backwardAngle - startAngle) > 1e-4) {
    const backwardAxis = startClientPoint.sub(
      projectWorldToClient(
        getLidHandleWorldPoint({
          pivotPositionModel,
          lidAngle: backwardAngle,
          scaleVector,
          position,
          rotation,
        }),
        camera,
        domElement
      )
    );

    if (backwardAxis.lengthSq() > 0.25) {
      return backwardAxis.normalize();
    }
  }

  return new THREE.Vector2(0, -1);
}

function resetLidBody(body, pose) {
  if (!body) {
    return;
  }

  body.setTranslation(pose.position, true);
  body.setRotation(pose.rotation, true);
  body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  body.wakeUp?.();
}

function setLidBodyPose(body, pose) {
  if (!body) {
    return;
  }

  body.setNextKinematicTranslation(pose.position);
  body.setNextKinematicRotation(pose.rotation);
  body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  body.wakeUp?.();
}

function isOccludedByObject({
  occluderObject,
  targetDistance,
  clientX,
  clientY,
  camera,
  domElement,
}) {
  if (!occluderObject) {
    return false;
  }

  sharedOcclusionRaycaster.setFromCamera(
    getNormalizedPointerPosition(clientX, clientY, domElement),
    camera
  );

  return sharedOcclusionRaycaster
    .intersectObject(occluderObject, true)
    .some(
      (intersection) =>
        intersection.distance <
        targetDistance - LID_OCCLUSION_DISTANCE_EPSILON
    );
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
    leftLidRotation = DUMPSTER_LEFT_LID_CLOSED_ANGLE,
    rightLidRotation = DUMPSTER_RIGHT_LID_CLOSED_ANGLE,
    frontLeftWheelRotation = Math.PI,
    frontRightWheelRotation = 0,
    rearLeftWheelRotation = Math.PI,
    rearRightWheelRotation = 0,
  } = componentProps;
  const leftLidOpenAngle = wrapToPi(leftLidRotation);
  const rightLidOpenAngle = wrapToPi(rightLidRotation);
  const leftLidAngleRange = useMemo(
    () => createLidAngleRange(DUMPSTER_LEFT_LID_CLOSED_ANGLE, leftLidOpenAngle),
    [leftLidOpenAngle]
  );
  const rightLidAngleRange = useMemo(
    () =>
      createLidAngleRange(DUMPSTER_RIGHT_LID_CLOSED_ANGLE, rightLidOpenAngle),
    [rightLidOpenAngle]
  );
  const leftLidInitialRotation = clampLidAngle(
    leftLidOpenAngle,
    leftLidAngleRange
  );
  const rightLidInitialRotation = clampLidAngle(
    rightLidOpenAngle,
    rightLidAngleRange
  );
  const leftLidAngleRef = useRef(leftLidInitialRotation);
  const rightLidAngleRef = useRef(rightLidInitialRotation);
  const sceneItemKey = getSceneItemKey(item);

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
  const dumpsterShellRootRef = useRef(null);
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
    const buildLidSession = ({
      pivotPositionModel,
      pivotPositionScene,
      angleRange,
      angleRef: lidAngleRef,
      bodyRef,
      occluderRef,
    }) => {
      return ({ intersection, clientX, clientY, camera, domElement }) => {
        if (
          isOccludedByObject({
            occluderObject: occluderRef.current,
            targetDistance: intersection.distance,
            clientX,
            clientY,
            camera,
            domElement,
          })
        ) {
          return null;
        }

        const sessionAngleRef = lidAngleRef;
        const startAngle = sessionAngleRef.current;
        const dragAxis = getLidScreenDragAxis({
          pivotPositionModel,
          startAngle,
          angleRange,
          scaleVector,
          position,
          rotation,
          camera,
          domElement,
        });
        const session = {
          kind: 'lid',
          startClientX: clientX,
          startClientY: clientY,
          startAngle,
          angleRef: sessionAngleRef,
        };

        session.getDraggedAngle = (nextClientX, nextClientY) =>
          clampLidAngle(
            startAngle +
              ((nextClientX - clientX) * dragAxis.x +
                (nextClientY - clientY) * dragAxis.y) *
                LID_DRAG_RADIANS_PER_PIXEL,
            angleRange
          );

        session.applyDraggedAngle = (angle) => {
          sessionAngleRef.current = angle;
          setLidBodyPose(
            bodyRef.current,
            getLidResetPose({
              lidAngle: angle,
              pivotPosition: pivotPositionScene,
              position,
              rotation,
            })
          );
        };

        return session;
      };
    };

    const leftTargetId = `${sceneItemKey}-left-lid`;
    const rightTargetId = `${sceneItemKey}-right-lid`;

    registerInteractiveTarget(leftTargetId, {
      getObject: () => leftLidDragRootRef.current,
      buildSession: buildLidSession({
        pivotPositionModel: DUMPSTER_LEFT_LID_PIVOT_POSITION,
        pivotPositionScene: leftLidPivotPosition,
        angleRange: leftLidAngleRange,
        angleRef: leftLidAngleRef,
        bodyRef: leftLidRef,
        occluderRef: dumpsterShellRootRef,
      }),
    });
    registerInteractiveTarget(rightTargetId, {
      getObject: () => rightLidDragRootRef.current,
      buildSession: buildLidSession({
        pivotPositionModel: DUMPSTER_RIGHT_LID_PIVOT_POSITION,
        pivotPositionScene: rightLidPivotPosition,
        angleRange: rightLidAngleRange,
        angleRef: rightLidAngleRef,
        bodyRef: rightLidRef,
        occluderRef: dumpsterShellRootRef,
      }),
    });

    return () => {
      unregisterInteractiveTarget(leftTargetId);
      unregisterInteractiveTarget(rightTargetId);
    };
  }, [
    leftLidAngleRange,
    leftLidPivotPosition,
    position,
    registerInteractiveTarget,
    rightLidPivotPosition,
    rotation,
    rightLidAngleRange,
    scaleVector,
    sceneItemKey,
    unregisterInteractiveTarget,
  ]);

  useEffect(() => {
    leftLidAngleRef.current = leftLidInitialRotation;
    rightLidAngleRef.current = rightLidInitialRotation;

    resetLidBody(
      leftLidRef.current,
      getLidResetPose({
        lidAngle: leftLidInitialRotation,
        pivotPosition: leftLidPivotPosition,
        position,
        rotation,
      })
    );
    resetLidBody(
      rightLidRef.current,
      getLidResetPose({
        lidAngle: rightLidInitialRotation,
        pivotPosition: rightLidPivotPosition,
        position,
        rotation,
      })
    );
  }, [
    cleanupNonce,
    leftLidInitialRotation,
    leftLidPivotPosition,
    position,
    rightLidInitialRotation,
    rightLidPivotPosition,
    rotation,
  ]);

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
        <group ref={dumpsterShellRootRef}>
          <DumpsterShell
            frontLeftWheelRotation={frontLeftWheelRotation}
            frontRightWheelRotation={frontRightWheelRotation}
            rearLeftWheelRotation={rearLeftWheelRotation}
            rearRightWheelRotation={rearRightWheelRotation}
            scale={scale}
          />
        </group>
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
