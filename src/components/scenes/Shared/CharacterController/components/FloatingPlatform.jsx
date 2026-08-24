import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import {
  CuboidCollider,
  RigidBody,
  useBeforePhysicsStep,
  useRapier,
} from '@react-three/rapier';

import * as THREE from 'three';

import SceneLabel from './SceneLabel';

const FLOOR_TOP_Y = -1;
const PLATFORM_HALF_HEIGHT = 0.1;
const FLOOR_CLEARANCE = 0.02;
const MIN_PLATFORM_CENTER_Y =
  FLOOR_TOP_Y + PLATFORM_HALF_HEIGHT + FLOOR_CLEARANCE;

export default function FloatingPlatform({ position = [0, 0, 0] }) {
  const floatingPlateRef = useRef();
  const floatingPlateRef2 = useRef();
  const floatingMovingPlateRef = useRef();
  const { rapier, world } = useRapier();
  const movingDir = useRef(1);

  const rayLength = 0.8;
  const rayDir = { x: 0, y: -1, z: 0 };
  const springDirVec = useMemo(() => new THREE.Vector3(), []);
  const origin = useMemo(() => new THREE.Vector3(), []);
  const rayCast = useMemo(
    () => new rapier.Ray(origin, rayDir),
    [rapier, origin]
  );
  const floatingDis = 0.8;
  const springK = 2.5;
  const dampingC = 0.15;

  const springDirVec2 = useMemo(() => new THREE.Vector3(), []);
  const origin2 = useMemo(() => new THREE.Vector3(), []);
  const rayCast2 = useMemo(
    () => new rapier.Ray(origin2, rayDir),
    [rapier, origin2]
  );

  const springDirVecMove = useMemo(() => new THREE.Vector3(), []);
  const originMove = useMemo(() => new THREE.Vector3(), []);
  const rayCastMove = useMemo(
    () => new rapier.Ray(originMove, rayDir),
    [rapier, originMove]
  );
  const movingVel = useMemo(() => new THREE.Vector3(), []);

  const clampBodyAboveFloor = useCallback((rb) => {
    if (!rb) return;
    const t = rb.translation();
    if (t.y >= MIN_PLATFORM_CENTER_Y) return;

    rb.setTranslation({ x: t.x, y: MIN_PLATFORM_CENTER_Y, z: t.z }, true);

    const lv = rb.linvel();
    if (lv.y < 0) {
      rb.setLinvel({ x: lv.x, y: 0, z: lv.z }, true);
    }
  }, []);

  const updatePlatformSpring = useCallback(
    (rb, ray, rayOrigin, springVec) => {
      if (!rb) return;

      const translation = rb.translation();
      rayOrigin.set(translation.x, translation.y, translation.z);

      const rayHit = world.castRay(
        ray,
        rayLength,
        false,
        undefined,
        undefined,
        undefined,
        rb
      );

      if (rayHit?.collider.parent()) {
        const force =
          springK * (floatingDis - rayHit.timeOfImpact) -
          rb.linvel().y * dampingC;
        rb.applyImpulse(springVec.set(0, force, 0), true);
      }

      clampBodyAboveFloor(rb);
    },
    [clampBodyAboveFloor, world]
  );

  useEffect(() => {
    floatingPlateRef.current.lockRotations(true);

    floatingPlateRef2.current.lockRotations(true);
    floatingPlateRef2.current.lockTranslations(true);
    floatingPlateRef2.current.setEnabledRotations(false, true, false);
    floatingPlateRef2.current.setEnabledTranslations(false, true, false);

    floatingMovingPlateRef.current.setEnabledRotations(false, true, false);
    floatingMovingPlateRef.current.setEnabledTranslations(true, true, false);
  }, []);

  useBeforePhysicsStep(() => {
    updatePlatformSpring(
      floatingPlateRef.current,
      rayCast,
      origin,
      springDirVec
    );
    updatePlatformSpring(
      floatingPlateRef2.current,
      rayCast2,
      origin2,
      springDirVec2
    );

    const movingPlatform = floatingMovingPlateRef.current;
    if (movingPlatform) {
      const translation = movingPlatform.translation();
      if (translation.x > position[0] + 10) {
        movingDir.current = -1;
      } else if (translation.x < position[0] - 5) {
        movingDir.current = 1;
      }

      movingPlatform.setLinvel(
        movingVel.set(
          movingDir.current > 0 ? 2 : -2,
          movingPlatform.linvel().y,
          0
        ),
        true
      );
    }

    updatePlatformSpring(
      movingPlatform,
      rayCastMove,
      originMove,
      springDirVecMove
    );
  });

  return (
    <group position={position}>
      <RigidBody
        position={[0, 5, -10]}
        mass={1}
        colliders={false}
        ref={floatingPlateRef}
      >
        <SceneLabel
          text="Floating Platform — push to move"
          position={[0, 2.5, 0]}
          scale={2}
        />
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
        <SceneLabel
          text="Floating Platform — push to rotate"
          position={[0, 2.5, 0]}
          scale={2}
        />
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
        <SceneLabel
          text="Floating & Moving Platform"
          position={[0, 2.5, 0]}
          scale={2}
        />
        <CuboidCollider args={[1.25, 0.1, 1.25]} />
        <mesh receiveShadow castShadow>
          <boxGeometry args={[2.5, 0.2, 2.5]} />
          <meshStandardMaterial color="lightsteelblue" />
        </mesh>
      </RigidBody>
    </group>
  );
}
