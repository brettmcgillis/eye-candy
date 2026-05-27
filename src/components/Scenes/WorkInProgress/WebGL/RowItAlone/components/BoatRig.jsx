import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import {
  RigidBody,
  interactionGroups,
  useRevoluteJoint,
} from '@react-three/rapier';

import { modelFile } from '../../../../../../utils/appUtils';

function cloneScaledGeometry(geometry, scale) {
  const cloned = geometry.clone();

  cloned.scale(scale, scale, scale);
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

function OarBody({
  bodyRef,
  geometry,
  material,
  oars,
  physics,
  position,
  probePoint,
  rotationY,
  runtime,
}) {
  const angularVelocityRef = useRef(new THREE.Vector3());
  const bodyPositionRef = useRef(new THREE.Vector3());
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

  useFrame(() => {
    const body = bodyRef.current;

    if (!body || !meshRef.current) {
      return;
    }

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
      Math.min(submersion, 0.18) *
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
      ref={bodyRef}
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
        receiveShadow
      />
    </RigidBody>
  );
}

function HullBody({
  asset,
  boat,
  geometries,
  hullRef,
  materials,
  physics,
  runtime,
}) {
  const angularVelocityRef = useRef(new THREE.Vector3());
  const bodyPositionRef = useRef(new THREE.Vector3());
  const bodyQuaternionRef = useRef(new THREE.Quaternion());
  const forceRef = useRef(new THREE.Vector3());
  const linearVelocityRef = useRef(new THREE.Vector3());
  const localProbePointsRef = useRef([
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
  ]);
  const pointOffsetRef = useRef(new THREE.Vector3());
  const pointVelocityRef = useRef(new THREE.Vector3());
  const worldProbePointsRef = useRef([
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
  ]);

  useFrame(() => {
    const body = hullRef.current;

    if (!body) {
      return;
    }

    const gravityMagnitude = Math.max(0.001, Math.abs(physics.gravity[1]));
    const probeForward = Math.min(boat.probeForward, asset.maxProbeForward);
    const probeSide = Math.min(boat.probeSide, asset.maxProbeSide);
    const bodyPosition = bodyPositionRef.current;
    const bodyQuaternion = bodyQuaternionRef.current;
    const linearVelocity = linearVelocityRef.current;
    const angularVelocityVector = angularVelocityRef.current;
    const force = forceRef.current;
    const localProbePoints = localProbePointsRef.current;
    const pointOffset = pointOffsetRef.current;
    const pointVelocity = pointVelocityRef.current;
    const worldProbePoints = worldProbePointsRef.current;
    const angularVelocity = body.angvel();
    const hullVelocity = body.linvel();
    const rotation = body.rotation();
    const translation = body.translation();

    bodyPosition.set(translation.x, translation.y, translation.z);
    bodyQuaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    linearVelocity.set(hullVelocity.x, hullVelocity.y, hullVelocity.z);
    angularVelocityVector.set(
      angularVelocity.x,
      angularVelocity.y,
      angularVelocity.z
    );

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
            boat.mass *
            gravityMagnitude -
            pointVelocity.y * boat.buoyancyDamping * boat.mass
        );

        force.set(0, forceStrength, 0);
        body.addForceAtPoint(force, worldProbePoint, true);
      }
    }
  });

  return (
    <RigidBody
      ref={hullRef}
      angularDamping={boat.angularDamping}
      canSleep={false}
      ccd
      collisionGroups={interactionGroups(HULL_COLLISION_GROUP, [])}
      colliders="hull"
      enabledRotations={[true, false, true]}
      enabledTranslations={[false, true, false]}
      linearDamping={boat.linearDamping}
      mass={boat.mass}
      position={boat.startPosition}
      rotation={[0, THREE.MathUtils.degToRad(boat.rotationY), 0]}
      solverGroups={interactionGroups(HULL_COLLISION_GROUP, [])}
      type="dynamic"
    >
      <mesh
        castShadow
        geometry={geometries.hull}
        material={materials.rowboat_1}
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
    </RigidBody>
  );
}

export default function BoatRig({ boat, oars, physics, runtime }) {
  const hullRef = useRef();
  const leftOarRef = useRef();
  const rightOarRef = useRef();
  const { materials, nodes } = useGLTF(modelFile('/rowboat.glb'));
  const asset = useMemo(() => {
    const geometries = {
      frontBench: cloneScaledGeometry(
        nodes.front_bench_mesh.geometry,
        boat.scale
      ),
      horizontalSupports: cloneScaledGeometry(
        nodes.horizontal_support_strips_mesh.geometry,
        boat.scale
      ),
      hull: cloneScaledGeometry(nodes.hull_mesh.geometry, boat.scale),
      leftLock: cloneScaledGeometry(
        nodes.left_oar_lock_mesh.geometry,
        boat.scale
      ),
      leftOar: cloneScaledGeometry(nodes.left_oar_mesh.geometry, boat.scale),
      middleBench: cloneScaledGeometry(
        nodes.middle_bench_mesh.geometry,
        boat.scale
      ),
      rearBench: cloneScaledGeometry(
        nodes.rear_bench_mesh.geometry,
        boat.scale
      ),
      rightLock: cloneScaledGeometry(
        nodes.right_oar_lock_mesh.geometry,
        boat.scale
      ),
      rightOar: cloneScaledGeometry(nodes.right_oar_mesh.geometry, boat.scale),
      supports: cloneScaledGeometry(
        nodes.support_strips_mesh.geometry,
        boat.scale
      ),
      upperEdge: cloneScaledGeometry(
        nodes.upper_edge_mesh.geometry,
        boat.scale
      ),
    };
    const hullBounds = geometries.hull.boundingBox;
    const hullHeight = hullBounds.max.y - hullBounds.min.y;
    const hullDepth = hullBounds.max.z - hullBounds.min.z;
    const hullWidth = hullBounds.max.x - hullBounds.min.x;
    const leftAnchor = getGeometryCenter(geometries.leftLock);
    const rightAnchor = getGeometryCenter(geometries.rightLock);

    return {
      geometries,
      leftAnchor,
      leftProbe: getOarProbePoint(geometries.leftOar, leftAnchor),
      maxProbeForward: hullDepth * 0.46,
      maxProbeSide: hullWidth * 0.42,
      maxSubmersion: hullHeight * 0.7,
      probeY: hullBounds.min.y + hullHeight * 0.08,
      restYOffset: -(hullBounds.min.y + hullHeight * 0.34),
      rightAnchor,
      rightProbe: getOarProbePoint(geometries.rightOar, rightAnchor),
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

  useRevoluteJoint(hullRef, leftOarRef, [
    asset.leftAnchor.toArray(),
    asset.leftAnchor.toArray(),
    JOINT_AXIS.toArray(),
    leftJointLimits,
  ]);
  useRevoluteJoint(hullRef, rightOarRef, [
    asset.rightAnchor.toArray(),
    asset.rightAnchor.toArray(),
    JOINT_AXIS.toArray(),
    rightJointLimits,
  ]);

  return (
    <>
      <HullBody
        asset={asset}
        boat={{ ...boat, startPosition }}
        geometries={asset.geometries}
        hullRef={hullRef}
        materials={materials}
        physics={physics}
        runtime={runtime}
      />
      <OarBody
        bodyRef={leftOarRef}
        geometry={asset.geometries.leftOar}
        material={materials.rowboat_2}
        oars={oars}
        physics={physics}
        position={startPosition}
        probePoint={asset.leftProbe}
        rotationY={boat.rotationY}
        runtime={runtime}
      />
      <OarBody
        bodyRef={rightOarRef}
        geometry={asset.geometries.rightOar}
        material={materials.rowboat_2}
        oars={oars}
        physics={physics}
        position={startPosition}
        probePoint={asset.rightProbe}
        rotationY={boat.rotationY}
        runtime={runtime}
      />
    </>
  );
}

useGLTF.preload(modelFile('/rowboat.glb'));
