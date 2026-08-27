import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import {
  ConvexHullCollider,
  RigidBody,
  interactionGroups,
  useBeforePhysicsStep,
  useRevoluteJoint,
} from '@react-three/rapier';

import * as THREE from 'three';

import { modelFile } from '@utils/appUtils';

const HULL_COLLISION_GROUP = 0;
const OAR_COLLISION_GROUP = 1;
const JOINT_AXIS = new THREE.Vector3(0, 1, 0);

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

function getOarBladePoint(geometry, anchor) {
  const { min, max } = geometry.boundingBox;
  const midY = (min.y + max.y) * 0.5;
  const candidates = [
    new THREE.Vector3(min.x, midY, (min.z + max.z) * 0.5),
    new THREE.Vector3(max.x, midY, (min.z + max.z) * 0.5),
    new THREE.Vector3((min.x + max.x) * 0.5, midY, min.z),
    new THREE.Vector3((min.x + max.x) * 0.5, midY, max.z),
  ];

  return candidates.reduce((farthest, candidate) =>
    candidate.distanceToSquared(anchor) > farthest.distanceToSquared(anchor)
      ? candidate
      : farthest
  );
}

function OarBody({
  bodyRef,
  geometry,
  material,
  oars,
  onBodyReady,
  physics,
  position,
  probePoint,
  rotationY,
  sampleHeight,
}) {
  const oarBodyRef = bodyRef;
  const bodyPositionRef = useRef(new THREE.Vector3());
  const forceRef = useRef(new THREE.Vector3());
  const linearVelocityRef = useRef(new THREE.Vector3());
  const angularVelocityRef = useRef(new THREE.Vector3());
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

    const waterHeight = sampleHeight(worldProbePoint.x, worldProbePoint.z);
    const submersion = waterHeight + oars.probeLift - worldProbePoint.y;

    if (submersion <= 0) {
      return;
    }

    const forceStrength = Math.max(
      0,
      Math.min(submersion, oars.maxSubmersion) *
        oars.buoyancy *
        physics.oarMass *
        gravityMagnitude -
        pointVelocity.y * oars.buoyancyDamping * physics.oarMass
    );

    force.set(0, forceStrength, 0);
    body.addForceAtPoint(force, worldProbePoint, true);
  });

  return (
    <RigidBody
      ref={(instance) => {
        oarBodyRef.current = instance;
        onBodyReady?.(instance);
      }}
      angularDamping={oars.angularDamping}
      canSleep={false}
      collisionGroups={interactionGroups(OAR_COLLISION_GROUP, [])}
      colliders="hull"
      linearDamping={oars.linearDamping}
      mass={physics.oarMass}
      position={position}
      rotation={rotation}
      type="dynamic"
    >
      <mesh ref={meshRef} castShadow geometry={geometry} material={material} />
    </RigidBody>
  );
}

function HullBody({
  asset,
  boat,
  geometries,
  hullColliderRef,
  hullRef,
  materials,
  onBodyReady,
  physics,
  sampleHeight,
}) {
  const hullBodyRef = hullRef;
  const angularVelocityRef = useRef(new THREE.Vector3());
  const bodyPositionRef = useRef(new THREE.Vector3());
  const bodyQuaternionRef = useRef(new THREE.Quaternion());
  const forceRef = useRef(new THREE.Vector3());
  const linearVelocityRef = useRef(new THREE.Vector3());
  const needsInitialResetRef = useRef(true);
  const pointOffsetRef = useRef(new THREE.Vector3());
  const pointVelocityRef = useRef(new THREE.Vector3());
  const localProbePointsRef = useRef([
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
  ]);
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
    needsInitialResetRef.current = true;
  }, [boat.rotationY, boat.startPosition]);

  useBeforePhysicsStep(() => {
    const body = hullRef.current;

    if (!body) {
      return;
    }

    if (needsInitialResetRef.current) {
      const hullCollider = hullColliderRef.current;

      if (hullCollider && Math.abs(body.mass() - boat.mass) >= 0.01) {
        hullCollider.setMass(boat.mass);
        body.recomputeMassPropertiesFromColliders();
      }

      body.setTranslation(
        {
          x: boat.startPosition[0],
          y: boat.startPosition[1],
          z: boat.startPosition[2],
        },
        false
      );
      body.setRotation(
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(0, THREE.MathUtils.degToRad(boat.rotationY), 0)
        ),
        false
      );
      body.setLinvel({ x: 0, y: 0, z: 0 }, false);
      body.setAngvel({ x: 0, y: 0, z: 0 }, false);
      needsInitialResetRef.current = false;

      return;
    }

    body.resetForces(false);
    body.resetTorques(false);

    const gravityMagnitude = Math.max(0.001, Math.abs(physics.gravity[1]));
    const probeForward = Math.min(boat.probeForward, asset.maxProbeForward);
    const probeSide = Math.min(boat.probeSide, asset.maxProbeSide);
    const bodyMass = body.mass();
    const bodyPosition = bodyPositionRef.current;
    const bodyQuaternion = bodyQuaternionRef.current;
    const force = forceRef.current;
    const linearVelocity = linearVelocityRef.current;
    const angularVelocityVector = angularVelocityRef.current;
    const localProbePoints = localProbePointsRef.current;
    const worldProbePoints = worldProbePointsRef.current;
    const pointOffset = pointOffsetRef.current;
    const pointVelocity = pointVelocityRef.current;
    const probeCount = localProbePoints.length;
    const angularVelocity = body.angvel();
    const rotation = body.rotation();
    const translation = body.translation();
    const velocity = body.linvel();

    bodyPosition.set(translation.x, translation.y, translation.z);
    bodyQuaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    linearVelocity.set(velocity.x, velocity.y, velocity.z);
    angularVelocityVector.set(
      angularVelocity.x,
      angularVelocity.y,
      angularVelocity.z
    );

    localProbePoints[0].set(-probeSide, asset.probeY, probeForward);
    localProbePoints[1].set(probeSide, asset.probeY, probeForward);
    localProbePoints[2].set(-probeSide, asset.probeY, -probeForward);
    localProbePoints[3].set(probeSide, asset.probeY, -probeForward);

    for (let index = 0; index < probeCount; index += 1) {
      const worldProbePoint = worldProbePoints[index];

      worldProbePoint
        .copy(localProbePoints[index])
        .applyQuaternion(bodyQuaternion)
        .add(bodyPosition);

      const waterHeight = sampleHeight(worldProbePoint.x, worldProbePoint.z);
      const submersion =
        waterHeight + boat.draft + boat.probeLift - worldProbePoint.y;

      if (submersion > 0) {
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
        body.addForceAtPoint(force, worldProbePoint, true);
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
      collisionGroups={interactionGroups(HULL_COLLISION_GROUP, [])}
      colliders={false}
      linearDamping={boat.linearDamping}
      position={boat.startPosition}
      rotation={[0, THREE.MathUtils.degToRad(boat.rotationY), 0]}
      type="dynamic"
    >
      <ConvexHullCollider
        args={hullColliderArgs}
        collisionGroups={interactionGroups(HULL_COLLISION_GROUP, [])}
        ref={hullColliderRef}
      />
      <mesh
        castShadow
        geometry={geometries.hull}
        material={materials.rowboat_1}
      />
      <mesh
        castShadow
        geometry={geometries.frontBench}
        material={materials.rowboat_2}
      />
      <mesh
        castShadow
        geometry={geometries.middleBench}
        material={materials.rowboat_2}
      />
      <mesh
        castShadow
        geometry={geometries.rearBench}
        material={materials.rowboat_2}
      />
      <mesh
        castShadow
        geometry={geometries.horizontalSupports}
        material={materials.rowboat_1}
      />
      <mesh
        castShadow
        geometry={geometries.supports}
        material={materials.rowboat_1}
      />
      <mesh
        castShadow
        geometry={geometries.upperEdge}
        material={materials.rowboat_2}
      />
      <mesh
        castShadow
        geometry={geometries.leftLock}
        material={materials.rowboat_2}
      />
      <mesh
        castShadow
        geometry={geometries.rightLock}
        material={materials.rowboat_2}
      />
    </RigidBody>
  );
}

function OarJoints({
  asset,
  hullRef,
  leftJointLimits,
  leftOarRef,
  rightJointLimits,
  rightOarRef,
}) {
  useRevoluteJoint(hullRef, leftOarRef, [
    asset.leftAnchor.toArray(),
    [0, 0, 0],
    JOINT_AXIS.toArray(),
    leftJointLimits,
  ]);
  useRevoluteJoint(hullRef, rightOarRef, [
    asset.rightAnchor.toArray(),
    [0, 0, 0],
    JOINT_AXIS.toArray(),
    rightJointLimits,
  ]);

  return null;
}

export default function BoatRig({ boat, oars, physics, runtimeRef, sampler }) {
  const hullColliderRef = useRef();
  const hullRef = useRef();
  const leftOarRef = useRef();
  const rightOarRef = useRef();
  const [jointBodiesReady, setJointBodiesReady] = useState(false);
  const surfaceScratchRef = useRef(new THREE.Vector3());
  const maskMatrixRef = useRef(new THREE.Matrix4());
  const maskPositionRef = useRef(new THREE.Vector3());
  const maskQuaternionRef = useRef(new THREE.Quaternion());
  const maskScaleRef = useRef(new THREE.Vector3(1, 1, 1));
  const { materials, nodes } = useGLTF(modelFile('/rowboat.glb'));

  const sampleHeight = useCallback(
    (x, z) =>
      sampler
        ? sampler.sampleSurfaceHeight(x, z, surfaceScratchRef.current)
        : 0,
    [sampler]
  );

  const asset = useMemo(() => {
    const scaledHull = cloneScaledGeometry(
      nodes.hull_mesh.geometry,
      boat.scale
    );
    const hullCenter = getGeometryCenter(scaledHull);
    const centeredOffset = hullCenter.clone().multiplyScalar(-1);
    const createCenteredGeometry = (geometry) =>
      cloneTranslatedGeometry(
        cloneScaledGeometry(geometry, boat.scale),
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
    const leftProbe = getOarBladePoint(rawLeftOar, leftAnchor).sub(leftAnchor);
    const rightProbe = getOarBladePoint(rawRightOar, rightAnchor).sub(
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

    return {
      geometries,
      hullDepth,
      hullHeight,
      hullWidth,
      leftAnchor,
      leftProbe,
      maxProbeForward: hullDepth * 0.46,
      maxProbeSide: hullWidth * 0.42,
      maxSubmersion: hullHeight * 0.7,
      probeY: hullBounds.min.y + hullHeight * 0.08,
      restYOffset: -(hullBounds.min.y + hullHeight * 0.31),
      rightAnchor,
      rightProbe,
    };
  }, [boat.scale, nodes]);

  const startPosition = useMemo(
    () => [
      boat.position[0],
      boat.position[1] + asset.restYOffset,
      boat.position[2],
    ],
    [asset.restYOffset, boat.position]
  );
  const leftOarStartPosition = useMemo(
    () =>
      getWorldOffsetPosition(startPosition, boat.rotationY, asset.leftAnchor),
    [asset.leftAnchor, boat.rotationY, startPosition]
  );
  const rightOarStartPosition = useMemo(
    () =>
      getWorldOffsetPosition(startPosition, boat.rotationY, asset.rightAnchor),
    [asset.rightAnchor, boat.rotationY, startPosition]
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

  const updateJointBodiesReady = useCallback(() => {
    setJointBodiesReady(
      Boolean(hullRef.current && leftOarRef.current && rightOarRef.current)
    );
  }, []);

  const resolvedOars = useMemo(
    () => ({ ...oars, maxSubmersion: asset.hullHeight * 0.5 }),
    [asset.hullHeight, oars]
  );

  useFrame(() => {
    const hullMask = runtimeRef?.current?.oceanManager?.hullMask;

    if (!hullMask) {
      return;
    }

    const body = hullRef.current;

    if (!body || !boat.hideInteriorWater) {
      hullMask.enabled.value = 0;

      return;
    }

    const translation = body.translation();
    const rotation = body.rotation();

    maskPositionRef.current.set(translation.x, translation.y, translation.z);
    maskQuaternionRef.current.set(
      rotation.x,
      rotation.y,
      rotation.z,
      rotation.w
    );
    maskMatrixRef.current
      .compose(
        maskPositionRef.current,
        maskQuaternionRef.current,
        maskScaleRef.current
      )
      .invert();

    hullMask.inverse.value.copy(maskMatrixRef.current);
    hullMask.extents.value.set(
      asset.hullWidth * 0.5 * boat.interiorInset,
      asset.hullDepth * 0.5 * boat.interiorInset
    );
    hullMask.enabled.value = 1;
  });

  return (
    <>
      <HullBody
        asset={asset}
        boat={{ ...boat, startPosition }}
        geometries={asset.geometries}
        hullColliderRef={hullColliderRef}
        hullRef={hullRef}
        materials={materials}
        onBodyReady={updateJointBodiesReady}
        physics={physics}
        sampleHeight={sampleHeight}
      />
      <OarBody
        bodyRef={leftOarRef}
        geometry={asset.geometries.leftOar}
        material={materials.rowboat_2}
        oars={resolvedOars}
        onBodyReady={updateJointBodiesReady}
        physics={physics}
        position={leftOarStartPosition}
        probePoint={asset.leftProbe}
        rotationY={boat.rotationY}
        sampleHeight={sampleHeight}
      />
      <OarBody
        bodyRef={rightOarRef}
        geometry={asset.geometries.rightOar}
        material={materials.rowboat_2}
        oars={resolvedOars}
        onBodyReady={updateJointBodiesReady}
        physics={physics}
        position={rightOarStartPosition}
        probePoint={asset.rightProbe}
        rotationY={boat.rotationY}
        sampleHeight={sampleHeight}
      />
      {jointBodiesReady ? (
        <OarJoints
          asset={asset}
          hullRef={hullRef}
          leftJointLimits={leftJointLimits}
          leftOarRef={leftOarRef}
          rightJointLimits={rightJointLimits}
          rightOarRef={rightOarRef}
        />
      ) : null}
    </>
  );
}

useGLTF.preload(modelFile('/rowboat.glb'));
