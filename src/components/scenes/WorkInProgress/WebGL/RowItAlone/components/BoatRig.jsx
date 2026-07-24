import * as THREE from 'three';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useGLTF } from '@react-three/drei';
import {
  ConvexHullCollider,
  RigidBody,
  interactionGroups,
  useBeforePhysicsStep,
  useRevoluteJoint,
} from '@react-three/rapier';

import { localEnv, modelFile } from '../../../../../../utils/appUtils';

function cloneScaledGeometry(geometry, scale) {
  const cloned = geometry.clone();

  cloned.scale(scale, scale, scale);
  cloned.computeBoundingBox();

  return cloned;
}

function cloneTranslatedGeometry(geometry, offset) {
  const cloned = geometry.clone();

  cloned.translate(offset.x, offset.y, offset.z);
  cloned.computeBoundingBox();

  return cloned;
}

function getGeometryCenter(geometry) {
  const center = new THREE.Vector3();

  geometry.computeBoundingBox();
  geometry.boundingBox.getCenter(center);

  return center;
}

const HULL_COLLISION_GROUP = 0;
const OAR_COLLISION_GROUP = 1;
const CURSOR_COLLISION_GROUP = 2;
const JOINT_AXIS = new THREE.Vector3(0, 1, 0);

function getWorldOffsetPosition(position, rotationY, localOffset) {
  const worldOffset = localOffset
    .clone()
    .applyAxisAngle(JOINT_AXIS, THREE.MathUtils.degToRad(rotationY));

  return [
    position[0] + worldOffset.x,
    position[1] + worldOffset.y,
    position[2] + worldOffset.z,
  ];
}

function applyLinearDragImpulse({
  body,
  bodyQuaternion,
  linearVelocity,
  timeStep,
  forwardDrag,
  lateralDrag,
  verticalDrag,
  target,
}) {
  const { inverseQuaternion, localVelocity, localImpulse, worldImpulse } =
    target;

  inverseQuaternion.copy(bodyQuaternion).invert();
  localVelocity.copy(linearVelocity).applyQuaternion(inverseQuaternion);

  localImpulse.set(
    -localVelocity.x * lateralDrag * timeStep,
    -localVelocity.y * verticalDrag * timeStep,
    -localVelocity.z * forwardDrag * timeStep
  );

  worldImpulse.copy(localImpulse).applyQuaternion(bodyQuaternion);
  body.applyImpulse(worldImpulse, true);
}

function getOarProbePoint(geometry, anchor) {
  const { min, max } = geometry.boundingBox;
  const midY = (min.y + max.y) * 0.5;
  const candidates = [
    new THREE.Vector3(min.x, midY, (min.z + max.z) * 0.5),
    new THREE.Vector3(max.x, midY, (min.z + max.z) * 0.5),
    new THREE.Vector3((min.x + max.x) * 0.5, midY, min.z),
    new THREE.Vector3((min.x + max.x) * 0.5, midY, max.z),
  ];

  return candidates.reduce((farthest, candidate) => {
    if (
      candidate.distanceToSquared(anchor) > farthest.distanceToSquared(anchor)
    ) {
      return candidate;
    }

    return farthest;
  });
}

function getPlanarGeometryPoints(geometry) {
  const { position } = geometry.attributes;
  const uniquePoints = new Map();

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const z = position.getZ(index);
    const key = `${x.toFixed(4)}:${z.toFixed(4)}`;

    if (!uniquePoints.has(key)) {
      uniquePoints.set(key, new THREE.Vector2(x, z));
    }
  }

  return [...uniquePoints.values()].sort((left, right) => {
    if (left.x === right.x) {
      return left.y - right.y;
    }

    return left.x - right.x;
  });
}

function cross2D(origin, pointA, pointB) {
  return (
    (pointA.x - origin.x) * (pointB.y - origin.y) -
    (pointA.y - origin.y) * (pointB.x - origin.x)
  );
}

function getConvexHull2D(points) {
  if (points.length <= 3) {
    return points.map((point) => point.clone());
  }

  const lower = [];

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];

    while (
      lower.length >= 2 &&
      cross2D(lower[lower.length - 2], lower[lower.length - 1], point) <= 0
    ) {
      lower.pop();
    }

    lower.push(point.clone());
  }

  const upper = [];

  for (let index = points.length - 1; index >= 0; index -= 1) {
    const point = points[index];

    while (
      upper.length >= 2 &&
      cross2D(upper[upper.length - 2], upper[upper.length - 1], point) <= 0
    ) {
      upper.pop();
    }

    upper.push(point.clone());
  }

  lower.pop();
  upper.pop();

  return lower.concat(upper);
}

function getSignedPolygonArea(points) {
  let area = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];

    area += current.x * next.y - next.x * current.y;
  }

  return area * 0.5;
}

function createMaskPolygon(geometry) {
  const rawPoints = getPlanarGeometryPoints(geometry);
  const fallbackBounds = geometry.boundingBox;
  const hullPoints =
    rawPoints.length >= 3
      ? getConvexHull2D(rawPoints)
      : [
          new THREE.Vector2(fallbackBounds.min.x, fallbackBounds.min.z),
          new THREE.Vector2(fallbackBounds.max.x, fallbackBounds.min.z),
          new THREE.Vector2(fallbackBounds.max.x, fallbackBounds.max.z),
          new THREE.Vector2(fallbackBounds.min.x, fallbackBounds.max.z),
        ];

  return getSignedPolygonArea(hullPoints) < 0
    ? hullPoints.reverse()
    : hullPoints;
}

function createMaskCapGeometry(points) {
  const shape = new THREE.Shape(points.map((point) => point.clone()));
  const geometry = new THREE.ShapeGeometry(shape);

  geometry.computeBoundingBox();

  return geometry;
}

function OarBody({
  bodyRef,
  geometry,
  interactionStateRef,
  material,
  onBodyReady,
  oars,
  onPointerMove,
  onPointerOut,
  physics,
  position,
  probePoint,
  rotationY,
  runtime,
  side,
}) {
  const angularVelocityRef = useRef(new THREE.Vector3());
  const bodyPositionRef = useRef(new THREE.Vector3());
  const bodyHandleRef = bodyRef;
  const forceRef = useRef(new THREE.Vector3());
  const linearVelocityRef = useRef(new THREE.Vector3());
  const meshRef = useRef();
  const pointOffsetRef = useRef(new THREE.Vector3());
  const pointVelocityRef = useRef(new THREE.Vector3());
  const worldProbePointRef = useRef(new THREE.Vector3());
  const rotation = useMemo(
    () => [0, THREE.MathUtils.degToRad(rotationY), 0],
    [rotationY]
  );

  useBeforePhysicsStep(() => {
    const body = bodyRef.current;

    if (!body || !meshRef.current) {
      return;
    }

    body.resetForces(false);
    body.resetTorques(false);

    const worldProbePoint = worldProbePointRef.current;
    const bodyPosition = bodyPositionRef.current;
    const force = forceRef.current;
    const gravityMagnitude = Math.max(0.001, Math.abs(physics.gravity[1]));
    const linearVelocity = linearVelocityRef.current;
    const angularVelocityVector = angularVelocityRef.current;
    const pointOffset = pointOffsetRef.current;
    const pointVelocity = pointVelocityRef.current;
    const angularVelocity = body.angvel();
    const translation = body.translation();
    const velocity = body.linvel();

    worldProbePoint.copy(probePoint);
    meshRef.current.localToWorld(worldProbePoint);

    if (interactionStateRef.current.activeSide === side) {
      runtime.clearPointerTarget();
      runtime.setInteractionTarget(worldProbePoint.x, worldProbePoint.z);
    }

    bodyPosition.set(translation.x, translation.y, translation.z);
    linearVelocity.set(velocity.x, velocity.y, velocity.z);
    angularVelocityVector.set(
      angularVelocity.x,
      angularVelocity.y,
      angularVelocity.z
    );
    pointOffset.copy(worldProbePoint).sub(bodyPosition);
    pointVelocity
      .copy(angularVelocityVector)
      .cross(pointOffset)
      .add(linearVelocity);

    const waterHeight = runtime.sampleHeight(
      worldProbePoint.x,
      worldProbePoint.z
    );
    const submersion = waterHeight + oars.probeLift - worldProbePoint.y;

    if (submersion <= 0) {
      return;
    }

    const forceStrength = Math.max(
      0,
      (Math.min(submersion, 0.18) *
        oars.buoyancy *
        physics.oarMass *
        gravityMagnitude -
        pointVelocity.y * oars.buoyancyDamping * physics.oarMass) *
        oars.forceScale
    );

    force.set(0, forceStrength, 0);
    body.addForceAtPoint(force, worldProbePoint, true);
  });

  return (
    <RigidBody
      ref={(instance) => {
        bodyHandleRef.current = instance;
        onBodyReady?.(instance);
      }}
      angularDamping={oars.angularDamping}
      canSleep={false}
      ccd
      collisionGroups={interactionGroups(OAR_COLLISION_GROUP, [
        CURSOR_COLLISION_GROUP,
      ])}
      colliders="hull"
      linearDamping={oars.linearDamping}
      mass={physics.oarMass}
      position={position}
      rotation={rotation}
      solverGroups={interactionGroups(OAR_COLLISION_GROUP, [
        CURSOR_COLLISION_GROUP,
      ])}
    >
      <mesh
        ref={meshRef}
        castShadow
        geometry={geometry}
        material={material}
        onPointerMove={onPointerMove}
        onPointerOut={onPointerOut}
        receiveShadow
      />
    </RigidBody>
  );
}

function HullBody({
  asset,
  boat,
  geometries,
  hullColliderRef,
  hullMaskCapRef,
  hullMeshRef,
  hullRef,
  materials,
  onBodyReady,
  onDebugUpdate,
  physics,
  runtime,
}) {
  const angularVelocityRef = useRef(new THREE.Vector3());
  const bodyPositionRef = useRef(new THREE.Vector3());
  const hullBodyRef = hullRef;
  const bodyQuaternionRef = useRef(new THREE.Quaternion());
  const debugCooldownRef = useRef(0);
  const debugEulerRef = useRef(new THREE.Euler());
  const forceRef = useRef(new THREE.Vector3());
  const linearVelocityRef = useRef(new THREE.Vector3());
  const localProbePointsRef = useRef([
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
  ]);
  const dragTargetsRef = useRef({
    inverseQuaternion: new THREE.Quaternion(),
    localImpulse: new THREE.Vector3(),
    localVelocity: new THREE.Vector3(),
    worldImpulse: new THREE.Vector3(),
  });
  const initialRotationRef = useRef(new THREE.Quaternion());
  const needsInitialBodyResetRef = useRef(true);
  const pointOffsetRef = useRef(new THREE.Vector3());
  const pointVelocityRef = useRef(new THREE.Vector3());
  const worldProbePointsRef = useRef([
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
  ]);
  const hullColliderArgs = useMemo(
    () => [geometries.hull.attributes.position.array],
    [geometries.hull]
  );

  useEffect(() => {
    needsInitialBodyResetRef.current = true;
  }, [boat.rotationY, boat.startPosition]);

  useBeforePhysicsStep(() => {
    const body = hullRef.current;
    const hullCollider = hullColliderRef.current;

    if (!body) {
      return;
    }

    if (needsInitialBodyResetRef.current) {
      const initialActualMass = body.mass();
      const initialColliderMass = hullCollider ? hullCollider.mass() : null;

      if (hullCollider && Math.abs(initialActualMass - boat.mass) >= 0.01) {
        hullCollider.setMass(boat.mass);
        body.recomputeMassPropertiesFromColliders();
      }

      const postSetActualMass = body.mass();
      const postSetColliderMass = hullCollider ? hullCollider.mass() : null;

      const initialTranslation = body.translation();
      const initialVelocity = body.linvel();
      const initialWorldCom = body.worldCom();
      const initialLocalCom = body.localCom();

      initialRotationRef.current.setFromEuler(
        new THREE.Euler(0, THREE.MathUtils.degToRad(boat.rotationY), 0)
      );

      body.setTranslation(
        {
          x: boat.startPosition[0],
          y: boat.startPosition[1],
          z: boat.startPosition[2],
        },
        false
      );
      body.setRotation(initialRotationRef.current, false);
      body.setLinvel({ x: 0, y: 0, z: 0 }, false);
      body.setAngvel({ x: 0, y: 0, z: 0 }, false);

      if (typeof window !== 'undefined') {
        const resetActualMass = body.mass();
        const resetTranslation = body.translation();
        const resetVelocity = body.linvel();
        const resetWorldCom = body.worldCom();
        const resetLocalCom = body.localCom();

        window.rowItAloneHullBootstrap = {
          after: {
            actualMass: resetActualMass,
            bodyY: resetTranslation.y,
            localCom: {
              x: resetLocalCom.x,
              y: resetLocalCom.y,
              z: resetLocalCom.z,
            },
            velocityY: resetVelocity.y,
            worldComY: resetWorldCom.y,
          },
          before: {
            actualMass: initialActualMass,
            bodyY: initialTranslation.y,
            localCom: {
              x: initialLocalCom.x,
              y: initialLocalCom.y,
              z: initialLocalCom.z,
            },
            velocityY: initialVelocity.y,
            worldComY: initialWorldCom.y,
          },
          startPositionY: boat.startPosition[1],
          colliderMassBeforeSet: initialColliderMass,
          colliderMassAfterSet: postSetColliderMass,
          bodyMassAfterSet: postSetActualMass,
          hadHullCollider: Boolean(hullCollider),
        };
      }

      needsInitialBodyResetRef.current = false;

      return;
    }

    body.resetForces(false);
    body.resetTorques(false);

    const gravityMagnitude = Math.max(0.001, Math.abs(physics.gravity[1]));
    const probeForward = Math.min(boat.probeForward, asset.maxProbeForward);
    const probeSide = Math.min(boat.probeSide, asset.maxProbeSide);
    const bodyMass = body.mass();
    const massReady = Math.abs(bodyMass - boat.mass) < 0.01;
    const bodyPosition = bodyPositionRef.current;
    const bodyQuaternion = bodyQuaternionRef.current;
    const dragTargets = dragTargetsRef.current;
    const linearVelocity = linearVelocityRef.current;
    const angularVelocityVector = angularVelocityRef.current;
    let averageProbeY = 0;
    let averageWaterHeight = 0;
    let averageSubmersion = 0;
    const force = forceRef.current;
    const localProbePoints = localProbePointsRef.current;
    let maxSubmersion = 0;
    const pointOffset = pointOffsetRef.current;
    const pointVelocity = pointVelocityRef.current;
    let submergedProbeCount = 0;
    let totalUpwardForce = 0;
    const worldProbePoints = worldProbePointsRef.current;
    const probeCount = localProbePoints.length;
    const angularVelocity = body.angvel();
    const hullVelocity = body.linvel();
    const localCom = body.localCom();
    const rotation = body.rotation();
    const translation = body.translation();
    const worldCom = body.worldCom();

    bodyPosition.set(translation.x, translation.y, translation.z);
    bodyQuaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    linearVelocity.set(hullVelocity.x, hullVelocity.y, hullVelocity.z);
    angularVelocityVector.set(
      angularVelocity.x,
      angularVelocity.y,
      angularVelocity.z
    );

    if (!massReady) {
      if (onDebugUpdate) {
        debugCooldownRef.current -= physics.timeStep;

        if (debugCooldownRef.current <= 0) {
          debugCooldownRef.current = 0.12;
          debugEulerRef.current.setFromQuaternion(bodyQuaternion, 'YXZ');

          onDebugUpdate({
            actualMass: bodyMass,
            averageProbeY: 0,
            averageSubmersion: 0,
            averageWaterHeight: 0,
            bodyY: bodyPosition.y,
            localCom: {
              x: localCom.x,
              y: localCom.y,
              z: localCom.z,
            },
            massReady,
            maxSubmersion: 0,
            pitchDeg: THREE.MathUtils.radToDeg(debugEulerRef.current.x),
            probeCount,
            rollDeg: THREE.MathUtils.radToDeg(debugEulerRef.current.z),
            submergedProbeCount: 0,
            totalUpwardForce: 0,
            velocityY: linearVelocity.y,
            weight: bodyMass * gravityMagnitude,
            worldComY: worldCom.y,
          });
        }
      }

      return;
    }

    applyLinearDragImpulse({
      body,
      bodyQuaternion,
      forwardDrag: boat.forwardDrag,
      lateralDrag: boat.lateralDrag,
      linearVelocity,
      target: dragTargets,
      timeStep: physics.timeStep,
      verticalDrag: boat.verticalDrag,
    });

    localProbePoints[0].set(-probeSide, asset.probeY, probeForward);
    localProbePoints[1].set(probeSide, asset.probeY, probeForward);
    localProbePoints[2].set(-probeSide, asset.probeY, -probeForward);
    localProbePoints[3].set(probeSide, asset.probeY, -probeForward);

    for (let index = 0; index < localProbePoints.length; index += 1) {
      const worldProbePoint = worldProbePoints[index];

      worldProbePoint
        .copy(localProbePoints[index])
        .applyQuaternion(bodyQuaternion)
        .add(bodyPosition);

      const waterHeight = runtime.sampleHeight(
        worldProbePoint.x,
        worldProbePoint.z
      );
      const submersion =
        waterHeight + boat.draft + boat.probeLift - worldProbePoint.y;

      averageProbeY += worldProbePoint.y;
      averageWaterHeight += waterHeight;

      if (submersion > 0) {
        averageSubmersion += submersion;
        maxSubmersion = Math.max(maxSubmersion, submersion);
        submergedProbeCount += 1;
        pointOffset.copy(worldProbePoint).sub(bodyPosition);
        pointVelocity
          .copy(angularVelocityVector)
          .cross(pointOffset)
          .add(linearVelocity);

        const forceStrength = Math.max(
          0,
          Math.min(submersion, asset.maxSubmersion) *
            boat.buoyancy *
            (bodyMass / probeCount) *
            gravityMagnitude -
            pointVelocity.y * boat.buoyancyDamping * (bodyMass / probeCount)
        );

        force.set(0, forceStrength, 0);
        totalUpwardForce += forceStrength;
        body.addForceAtPoint(force, worldProbePoint, true);
      }
    }

    if (onDebugUpdate) {
      debugCooldownRef.current -= physics.timeStep;

      if (debugCooldownRef.current <= 0) {
        debugCooldownRef.current = 0.12;
        debugEulerRef.current.setFromQuaternion(bodyQuaternion, 'YXZ');

        onDebugUpdate({
          actualMass: bodyMass,
          averageProbeY: averageProbeY / probeCount,
          averageSubmersion:
            submergedProbeCount > 0
              ? averageSubmersion / submergedProbeCount
              : 0,
          averageWaterHeight: averageWaterHeight / probeCount,
          bodyY: bodyPosition.y,
          localCom: {
            x: localCom.x,
            y: localCom.y,
            z: localCom.z,
          },
          massReady,
          maxSubmersion,
          pitchDeg: THREE.MathUtils.radToDeg(debugEulerRef.current.x),
          probeCount,
          rollDeg: THREE.MathUtils.radToDeg(debugEulerRef.current.z),
          submergedProbeCount,
          totalUpwardForce,
          velocityY: linearVelocity.y,
          weight: bodyMass * gravityMagnitude,
          worldComY: worldCom.y,
        });
      }
    }
  });

  return (
    <RigidBody
      ref={(instance) => {
        hullBodyRef.current = instance;
        onBodyReady?.(instance);
      }}
      angularDamping={boat.angularDamping}
      canSleep={false}
      ccd
      collisionGroups={interactionGroups(HULL_COLLISION_GROUP, [])}
      colliders={false}
      linearDamping={boat.linearDamping}
      position={boat.startPosition}
      rotation={[0, THREE.MathUtils.degToRad(boat.rotationY), 0]}
      solverGroups={interactionGroups(HULL_COLLISION_GROUP, [])}
      type="dynamic"
    >
      <ConvexHullCollider
        args={hullColliderArgs}
        collisionGroups={interactionGroups(HULL_COLLISION_GROUP, [])}
        ref={hullColliderRef}
        solverGroups={interactionGroups(HULL_COLLISION_GROUP, [])}
      />
      <mesh
        castShadow
        geometry={geometries.hull}
        material={materials.rowboat_1}
        ref={hullMeshRef}
        receiveShadow
      />
      <mesh
        castShadow
        geometry={geometries.frontBench}
        material={materials.rowboat_2}
        receiveShadow
      />
      <mesh
        castShadow
        geometry={geometries.middleBench}
        material={materials.rowboat_2}
        receiveShadow
      />
      <mesh
        castShadow
        geometry={geometries.rearBench}
        material={materials.rowboat_2}
        receiveShadow
      />
      <mesh
        castShadow
        geometry={geometries.horizontalSupports}
        material={materials.rowboat_1}
        receiveShadow
      />
      <mesh
        castShadow
        geometry={geometries.supports}
        material={materials.rowboat_1}
        receiveShadow
      />
      <mesh
        castShadow
        geometry={geometries.upperEdge}
        material={materials.rowboat_2}
        receiveShadow
      />
      <mesh
        castShadow
        geometry={geometries.leftLock}
        material={materials.rowboat_2}
        receiveShadow
      />
      <mesh
        castShadow
        geometry={geometries.rightLock}
        material={materials.rowboat_2}
        receiveShadow
      />
      <mesh
        geometry={asset.maskCapGeometry}
        position-y={asset.maskPlaneY}
        ref={hullMaskCapRef}
        rotation-x={Math.PI / 2}
        visible={false}
      />
    </RigidBody>
  );
}

function OarJoints({
  asset,
  hullRef,
  leftJointLimits,
  leftOarRef,
  oarInteractionRef,
  physics,
  resolvedOars,
  rightJointLimits,
  rightOarRef,
}) {
  const leftJoint = useRevoluteJoint(hullRef, leftOarRef, [
    asset.leftAnchor.toArray(),
    [0, 0, 0],
    JOINT_AXIS.toArray(),
    leftJointLimits,
  ]);
  const rightJoint = useRevoluteJoint(hullRef, rightOarRef, [
    asset.rightAnchor.toArray(),
    [0, 0, 0],
    JOINT_AXIS.toArray(),
    rightJointLimits,
  ]);

  useBeforePhysicsStep(() => {
    const interactionState = oarInteractionRef.current;
    const releaseBlend =
      1 - Math.exp(-resolvedOars.hoverReturnRate * physics.timeStep);

    if (interactionState.activeSide !== 'left') {
      interactionState.leftTargetAngle = THREE.MathUtils.lerp(
        interactionState.leftTargetAngle,
        0,
        releaseBlend
      );
    }

    if (interactionState.activeSide !== 'right') {
      interactionState.rightTargetAngle = THREE.MathUtils.lerp(
        interactionState.rightTargetAngle,
        0,
        releaseBlend
      );
    }

    if (leftJoint.current) {
      leftJoint.current.configureMotorPosition(
        interactionState.leftTargetAngle,
        interactionState.activeSide === 'left'
          ? resolvedOars.activeMotorStiffness
          : 0,
        interactionState.activeSide === 'left'
          ? resolvedOars.activeMotorDamping
          : 0
      );
    }

    if (rightJoint.current) {
      rightJoint.current.configureMotorPosition(
        interactionState.rightTargetAngle,
        interactionState.activeSide === 'right'
          ? resolvedOars.activeMotorStiffness
          : 0,
        interactionState.activeSide === 'right'
          ? resolvedOars.activeMotorDamping
          : 0
      );
    }
  });

  return null;
}

export default function BoatRig({ boat, maskPass, oars, physics, runtime }) {
  const hullColliderRef = useRef();
  const hullMaskCapRef = useRef();
  const hullRef = useRef();
  const hullMeshRef = useRef();
  const hullDebugEnabled = useMemo(() => localEnv(), []);
  const [jointBodiesReady, setJointBodiesReady] = useState(false);
  const leftOarRef = useRef();
  const rightOarRef = useRef();
  const oarInteractionRef = useRef({
    activeSide: null,
    leftTargetAngle: 0,
    rightTargetAngle: 0,
  });
  const reportHullDebug = useCallback(
    (nextDebug) => {
      if (!hullDebugEnabled || typeof window === 'undefined') {
        return;
      }

      window.rowItAloneHullDebug = nextDebug;
    },
    [hullDebugEnabled]
  );
  const resolvedBoat = useMemo(
    () => ({
      ...boat,
      forwardDrag: Number.isFinite(boat.forwardDrag) ? boat.forwardDrag : 0,
      hullOnlyProbe: boat.hullOnlyProbe ?? false,
      lateralDrag: Number.isFinite(boat.lateralDrag) ? boat.lateralDrag : 0,
      verticalDrag: Number.isFinite(boat.verticalDrag) ? boat.verticalDrag : 0,
    }),
    [boat]
  );
  const { hullOnlyProbe } = resolvedBoat;
  const resolvedOars = useMemo(
    () => ({
      ...oars,
      activeMotorDamping: Number.isFinite(oars.activeMotorDamping)
        ? oars.activeMotorDamping
        : 0,
      activeMotorStiffness: Number.isFinite(oars.activeMotorStiffness)
        ? oars.activeMotorStiffness
        : 0,
      forceScale: Number.isFinite(oars.forceScale) ? oars.forceScale : 0,
      hoverReturnRate: Number.isFinite(oars.hoverReturnRate)
        ? oars.hoverReturnRate
        : 0,
      hoverSweepScale: Number.isFinite(oars.hoverSweepScale)
        ? oars.hoverSweepScale
        : 0,
    }),
    [oars]
  );
  const { materials, nodes } = useGLTF(modelFile('/rowboat.glb'));
  const asset = useMemo(() => {
    const scaledHull = cloneScaledGeometry(
      nodes.hull_mesh.geometry,
      resolvedBoat.scale
    );
    const hullCenter = getGeometryCenter(scaledHull);
    const centeredOffset = hullCenter.clone().multiplyScalar(-1);
    const createCenteredGeometry = (geometry) =>
      cloneTranslatedGeometry(
        cloneScaledGeometry(geometry, resolvedBoat.scale),
        centeredOffset
      );
    const leftLock = createCenteredGeometry(nodes.left_oar_lock_mesh.geometry);
    const rightLock = createCenteredGeometry(
      nodes.right_oar_lock_mesh.geometry
    );
    const rawLeftOar = createCenteredGeometry(nodes.left_oar_mesh.geometry);
    const rawRightOar = createCenteredGeometry(nodes.right_oar_mesh.geometry);
    const leftAnchor = getGeometryCenter(leftLock);
    const rightAnchor = getGeometryCenter(rightLock);
    const leftProbe = getOarProbePoint(rawLeftOar, leftAnchor).sub(leftAnchor);
    const rightProbe = getOarProbePoint(rawRightOar, rightAnchor).sub(
      rightAnchor
    );
    const geometries = {
      frontBench: createCenteredGeometry(nodes.front_bench_mesh.geometry),
      horizontalSupports: createCenteredGeometry(
        nodes.horizontal_support_strips_mesh.geometry
      ),
      hull: createCenteredGeometry(nodes.hull_mesh.geometry),
      leftLock,
      leftOar: cloneTranslatedGeometry(
        rawLeftOar,
        leftAnchor.clone().multiplyScalar(-1)
      ),
      middleBench: createCenteredGeometry(nodes.middle_bench_mesh.geometry),
      rearBench: createCenteredGeometry(nodes.rear_bench_mesh.geometry),
      rightLock,
      rightOar: cloneTranslatedGeometry(
        rawRightOar,
        rightAnchor.clone().multiplyScalar(-1)
      ),
      supports: createCenteredGeometry(nodes.support_strips_mesh.geometry),
      upperEdge: createCenteredGeometry(nodes.upper_edge_mesh.geometry),
    };
    const hullBounds = geometries.hull.boundingBox;
    const hullHeight = hullBounds.max.y - hullBounds.min.y;
    const hullDepth = hullBounds.max.z - hullBounds.min.z;
    const hullWidth = hullBounds.max.x - hullBounds.min.x;
    const upperEdgeBounds = geometries.upperEdge.boundingBox;
    const maskPoints = createMaskPolygon(geometries.upperEdge);

    return {
      centerOfBuoyancyOffset: hullBounds.min.y + hullHeight * 0.24,
      geometries,
      leftAnchor,
      leftProbe,
      maskCapGeometry: createMaskCapGeometry(maskPoints),
      maskPlaneY: THREE.MathUtils.lerp(
        upperEdgeBounds.min.y,
        upperEdgeBounds.max.y,
        0.35
      ),
      maxProbeForward: hullDepth * 0.46,
      maxProbeSide: hullWidth * 0.42,
      maxSubmersion: hullHeight * 0.7,
      probeY: hullBounds.min.y + hullHeight * 0.08,
      restYOffset: -(hullBounds.min.y + hullHeight * 0.31),
      rightAnchor,
      rightProbe,
    };
  }, [nodes, resolvedBoat.scale]);
  const startPosition = useMemo(
    () => [
      resolvedBoat.position[0],
      resolvedBoat.position[1] + asset.restYOffset,
      resolvedBoat.position[2],
    ],
    [asset.restYOffset, resolvedBoat.position]
  );
  const leftOarStartPosition = useMemo(
    () =>
      getWorldOffsetPosition(
        startPosition,
        resolvedBoat.rotationY,
        asset.leftAnchor
      ),
    [asset.leftAnchor, resolvedBoat.rotationY, startPosition]
  );
  const rightOarStartPosition = useMemo(
    () =>
      getWorldOffsetPosition(
        startPosition,
        resolvedBoat.rotationY,
        asset.rightAnchor
      ),
    [asset.rightAnchor, resolvedBoat.rotationY, startPosition]
  );
  const leftJointLimits = useMemo(
    () => [
      -THREE.MathUtils.degToRad(oars.jointMaxAngle),
      -THREE.MathUtils.degToRad(oars.jointMinAngle),
    ],
    [oars.jointMaxAngle, oars.jointMinAngle]
  );
  const rightJointLimits = useMemo(
    () => [
      THREE.MathUtils.degToRad(oars.jointMinAngle),
      THREE.MathUtils.degToRad(oars.jointMaxAngle),
    ],
    [oars.jointMaxAngle, oars.jointMinAngle]
  );

  const handleOarPointerMove = useCallback(
    (side, event) => {
      event.stopPropagation();

      const interactionState = oarInteractionRef.current;
      const movementX = event.nativeEvent.movementX ?? 0;
      const limits = side === 'left' ? leftJointLimits : rightJointLimits;
      const key = side === 'left' ? 'leftTargetAngle' : 'rightTargetAngle';
      const direction = side === 'left' ? -1 : 1;

      interactionState.activeSide = side;
      interactionState[key] = THREE.MathUtils.clamp(
        interactionState[key] +
          movementX * resolvedOars.hoverSweepScale * direction,
        limits[0],
        limits[1]
      );

      runtime.clearPointerTarget();
    },
    [leftJointLimits, resolvedOars.hoverSweepScale, rightJointLimits, runtime]
  );

  const handleOarPointerOut = useCallback(
    (side, event) => {
      event.stopPropagation();

      if (oarInteractionRef.current.activeSide === side) {
        oarInteractionRef.current.activeSide = null;
        runtime.clearInteractionTarget();
      }
    },
    [runtime]
  );

  const updateJointBodiesReady = useCallback(() => {
    setJointBodiesReady(
      Boolean(hullRef.current && leftOarRef.current && rightOarRef.current)
    );
  }, []);

  const handleHullBodyReady = useCallback(
    (instance) => {
      hullRef.current = instance;
      updateJointBodiesReady();
    },
    [updateJointBodiesReady]
  );

  const handleLeftOarBodyReady = useCallback(
    (instance) => {
      leftOarRef.current = instance;
      updateJointBodiesReady();
    },
    [updateJointBodiesReady]
  );

  const handleRightOarBodyReady = useCallback(
    (instance) => {
      rightOarRef.current = instance;
      updateJointBodiesReady();
    },
    [updateJointBodiesReady]
  );

  useEffect(
    () => () => {
      if (typeof window !== 'undefined') {
        delete window.rowItAloneHullDebug;
      }
    },
    []
  );

  useEffect(() => {
    if (!maskPass) {
      return undefined;
    }

    maskPass.setHullSource(hullMeshRef.current);
    maskPass.setCapSource(hullMaskCapRef.current);

    return () => {
      maskPass.setCapSource(null);
      maskPass.setHullSource(null);
    };
  }, [asset.maskCapGeometry, asset.geometries.hull, maskPass]);

  if (hullOnlyProbe) {
    return (
      <HullBody
        asset={asset}
        boat={{ ...resolvedBoat, startPosition }}
        geometries={asset.geometries}
        hullColliderRef={hullColliderRef}
        hullMaskCapRef={hullMaskCapRef}
        hullMeshRef={hullMeshRef}
        hullRef={hullRef}
        materials={materials}
        onBodyReady={handleHullBodyReady}
        onDebugUpdate={hullDebugEnabled ? reportHullDebug : null}
        physics={physics}
        runtime={runtime}
      />
    );
  }

  return (
    <>
      <HullBody
        asset={asset}
        boat={{ ...resolvedBoat, startPosition }}
        geometries={asset.geometries}
        hullColliderRef={hullColliderRef}
        hullMaskCapRef={hullMaskCapRef}
        hullMeshRef={hullMeshRef}
        hullRef={hullRef}
        materials={materials}
        onBodyReady={handleHullBodyReady}
        onDebugUpdate={hullDebugEnabled ? reportHullDebug : null}
        physics={physics}
        runtime={runtime}
      />
      <OarBody
        bodyRef={leftOarRef}
        geometry={asset.geometries.leftOar}
        interactionStateRef={oarInteractionRef}
        material={materials.rowboat_2}
        onBodyReady={handleLeftOarBodyReady}
        oars={resolvedOars}
        onPointerMove={(event) => handleOarPointerMove('left', event)}
        onPointerOut={(event) => handleOarPointerOut('left', event)}
        physics={physics}
        position={leftOarStartPosition}
        probePoint={asset.leftProbe}
        rotationY={resolvedBoat.rotationY}
        runtime={runtime}
        side="left"
      />
      <OarBody
        bodyRef={rightOarRef}
        geometry={asset.geometries.rightOar}
        interactionStateRef={oarInteractionRef}
        material={materials.rowboat_2}
        onBodyReady={handleRightOarBodyReady}
        oars={resolvedOars}
        onPointerMove={(event) => handleOarPointerMove('right', event)}
        onPointerOut={(event) => handleOarPointerOut('right', event)}
        physics={physics}
        position={rightOarStartPosition}
        probePoint={asset.rightProbe}
        rotationY={resolvedBoat.rotationY}
        runtime={runtime}
        side="right"
      />
      {jointBodiesReady ? (
        <OarJoints
          asset={asset}
          hullRef={hullRef}
          leftJointLimits={leftJointLimits}
          leftOarRef={leftOarRef}
          oarInteractionRef={oarInteractionRef}
          physics={physics}
          resolvedOars={resolvedOars}
          rightJointLimits={rightJointLimits}
          rightOarRef={rightOarRef}
        />
      ) : null}
    </>
  );
}

useGLTF.preload(modelFile('/rowboat.glb'));
