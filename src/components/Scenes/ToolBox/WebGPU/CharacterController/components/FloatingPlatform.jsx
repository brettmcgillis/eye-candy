import * as THREE from 'three';

import React, { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import Label3D from './Label3D';
import { CuboidCollider, RigidBody, useRapier } from '@react-three/rapier';

export default function FloatingPlatform() {
  const floatingPlateRef = useRef();
  const floatingPlateRef2 = useRef();
  const floatingMovingPlateRef = useRef();
  const { rapier, world } = useRapier();

  const rayLength = 0.8;
  const rayDir = { x: 0, y: -1, z: 0 };
  const springDirVec = useMemo(() => new THREE.Vector3(), []);
  const origin = useMemo(() => new THREE.Vector3(), []);
  const rayCast = new rapier.Ray(origin, rayDir);
  let rayHit = null;
  const floatingDis = 0.8;
  const springK = 2.5;
  const dampingC = 0.15;

  const springDirVec2 = useMemo(() => new THREE.Vector3(), []);
  const origin2 = useMemo(() => new THREE.Vector3(), []);
  const rayCast2 = new rapier.Ray(origin2, rayDir);
  let rayHit2 = null;

  const springDirVecMove = useMemo(() => new THREE.Vector3(), []);
  const originMove = useMemo(() => new THREE.Vector3(), []);
  const rayCastMove = new rapier.Ray(originMove, rayDir);
  const movingVel = useMemo(() => new THREE.Vector3(), []);
  let movingDir = 1;
  let rayHitMove = null;

  useEffect(() => {
    floatingPlateRef.current.lockRotations(true);

    floatingPlateRef2.current.lockRotations(true);
    floatingPlateRef2.current.lockTranslations(true);
    floatingPlateRef2.current.setEnabledRotations(false, true, false);
    floatingPlateRef2.current.setEnabledTranslations(false, true, false);

    floatingMovingPlateRef.current.setEnabledRotations(false, true, false);
    floatingMovingPlateRef.current.setEnabledTranslations(true, true, false);
  }, []);

  useFrame(() => {
    if (floatingPlateRef.current) {
      origin.set(
        floatingPlateRef.current.translation().x,
        floatingPlateRef.current.translation().y,
        floatingPlateRef.current.translation().z
      );
      rayHit = world.castRay(
        rayCast,
        rayLength,
        false,
        undefined,
        undefined,
        undefined,
        floatingPlateRef.current
      );
    }
    if (floatingPlateRef2.current) {
      origin2.set(
        floatingPlateRef2.current.translation().x,
        floatingPlateRef2.current.translation().y,
        floatingPlateRef2.current.translation().z
      );
      rayHit2 = world.castRay(
        rayCast2,
        rayLength,
        false,
        undefined,
        undefined,
        undefined,
        floatingPlateRef2.current
      );
    }
    if (floatingMovingPlateRef.current) {
      originMove.set(
        floatingMovingPlateRef.current.translation().x,
        floatingMovingPlateRef.current.translation().y,
        floatingMovingPlateRef.current.translation().z
      );
      rayHitMove = world.castRay(
        rayCastMove,
        rayLength,
        false,
        undefined,
        undefined,
        undefined,
        floatingMovingPlateRef.current
      );
      if (floatingMovingPlateRef.current.translation().x > 10) {
        movingDir = -1;
      } else if (floatingMovingPlateRef.current.translation().x < -5) {
        movingDir = 1;
      }
      floatingMovingPlateRef.current.setLinvel(
        movingVel.set(
          movingDir > 0 ? 2 : -2,
          floatingMovingPlateRef.current.linvel().y,
          0
        )
      );
    }

    if (rayHit?.collider.parent()) {
      const force =
        springK * (floatingDis - rayHit.timeOfImpact) -
        floatingPlateRef.current.linvel().y * dampingC;
      floatingPlateRef.current.applyImpulse(
        springDirVec.set(0, force, 0),
        true
      );
    }
    if (rayHit2?.collider.parent()) {
      const force2 =
        springK * (floatingDis - rayHit2.timeOfImpact) -
        floatingPlateRef2.current.linvel().y * dampingC;
      floatingPlateRef2.current.applyImpulse(
        springDirVec2.set(0, force2, 0),
        true
      );
    }
    if (rayHitMove?.collider.parent()) {
      const forceMove =
        springK * (floatingDis - rayHitMove.timeOfImpact) -
        floatingMovingPlateRef.current.linvel().y * dampingC;
      floatingMovingPlateRef.current.applyImpulse(
        springDirVecMove.set(0, forceMove, 0),
        true
      );
    }
  });

  return (
    <>
      <RigidBody
        position={[0, 5, -10]}
        mass={1}
        colliders={false}
        ref={floatingPlateRef}
      >
        <Label3D text="Floating Platform — push to move" position={[0, 2.5, 0]} />
        <CuboidCollider args={[2.5, 0.1, 2.5]} />
        <mesh receiveShadow castShadow>
          <boxGeometry args={[5, 0.2, 5]} />
          <meshStandardMaterial color="lightsteelblue" />
        </mesh>
      </RigidBody>

      <RigidBody
        position={[7, 5, -10]}
        mass={1}
        colliders={false}
        ref={floatingPlateRef2}
      >
        <Label3D text="Floating Platform — push to rotate" position={[0, 2.5, 0]} />
        <CuboidCollider args={[2.5, 0.1, 2.5]} />
        <mesh receiveShadow castShadow>
          <boxGeometry args={[5, 0.2, 5]} />
          <meshStandardMaterial color="lightsteelblue" />
        </mesh>
      </RigidBody>

      <RigidBody
        position={[0, 5, -17]}
        mass={1}
        colliders={false}
        ref={floatingMovingPlateRef}
      >
        <Label3D text="Floating & Moving Platform" position={[0, 2.5, 0]} />
        <CuboidCollider args={[1.25, 0.1, 1.25]} />
        <mesh receiveShadow castShadow>
          <boxGeometry args={[2.5, 0.2, 2.5]} />
          <meshStandardMaterial color="lightsteelblue" />
        </mesh>
      </RigidBody>
    </>
  );
}
