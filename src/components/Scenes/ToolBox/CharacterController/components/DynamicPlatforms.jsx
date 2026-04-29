import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import {
  CuboidCollider,
  CylinderCollider,
  RigidBody,
  useBeforePhysicsStep,
} from '@react-three/rapier';

import SceneLabel from './SceneLabel';

const PHYSICS_STEP = 1 / 60;

export default function DynamicPlatforms({ position = [0, 0, 0] }) {
  const sideMovePlatformRef = useRef();
  const verticalMovePlatformRef = useRef();
  const rotatePlatformRef = useRef();
  const rotationDrumRef = useRef();
  const time = useRef(0);

  const xRotationAxies = useMemo(() => new THREE.Vector3(1, 0, 0), []);
  const yRotationAxies = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const quaternionRotation = useMemo(() => new THREE.Quaternion(), []);

  useBeforePhysicsStep(() => {
    time.current += PHYSICS_STEP;

    sideMovePlatformRef.current?.setNextKinematicTranslation({
      x: 5 * Math.sin(time.current / 2) - 12 + position[0],
      y: -0.5 + position[1],
      z: -10 + position[2],
    });

    verticalMovePlatformRef.current?.setNextKinematicTranslation({
      x: -25 + position[0],
      y: 2 * Math.sin(time.current / 2) + 2 + position[1],
      z: position[2],
    });
    verticalMovePlatformRef.current?.setNextKinematicRotation(
      quaternionRotation.setFromAxisAngle(yRotationAxies, time.current * 0.5)
    );

    rotatePlatformRef.current?.setNextKinematicRotation(
      quaternionRotation.setFromAxisAngle(yRotationAxies, time.current * 0.5)
    );

    rotationDrumRef.current?.setNextKinematicRotation(
      quaternionRotation.setFromAxisAngle(xRotationAxies, time.current * 0.5)
    );
  });

  return (
    <group position={position}>
      <RigidBody
        type="kinematicPosition"
        ref={sideMovePlatformRef}
        colliders={false}
      >
        <SceneLabel
          text="Kinematic Moving Platform"
          position={[0, 2.5, 0]}
          scale={2}
        />
        <CuboidCollider args={[2.5, 0.1, 2.5]} />
        <mesh receiveShadow castShadow>
          <boxGeometry args={[5, 0.2, 5]} />
          <meshStandardMaterial color="moccasin" />
        </mesh>
      </RigidBody>

      <RigidBody
        type="kinematicPosition"
        position={[-25, 0, 0]}
        ref={verticalMovePlatformRef}
        colliders={false}
      >
        <SceneLabel
          text="Kinematic Elevating Platform"
          position={[0, 2.5, 0]}
          scale={2}
        />
        <CuboidCollider args={[2.5, 0.1, 2.5]} />
        <mesh receiveShadow castShadow>
          <boxGeometry args={[5, 0.2, 5]} />
          <meshStandardMaterial color="moccasin" />
        </mesh>
      </RigidBody>

      <RigidBody
        type="kinematicPosition"
        position={[-25, -0.5, -10]}
        ref={rotatePlatformRef}
        colliders={false}
      >
        <SceneLabel
          text="Kinematic Rotating Platform"
          position={[0, 2.5, 0]}
          scale={2}
        />
        <CuboidCollider args={[2.5, 0.1, 2.5]} />
        <mesh receiveShadow castShadow>
          <boxGeometry args={[5, 0.2, 5]} />
          <meshStandardMaterial color="moccasin" />
        </mesh>
      </RigidBody>

      <SceneLabel
        text="Kinematic Rotating Drum"
        position={[-15, 1.5, -15]}
        scale={2}
      />
      <RigidBody
        colliders={false}
        type="kinematicPosition"
        position={[-15, -1, -15]}
        ref={rotationDrumRef}
      >
        <group rotation={[0, 0, Math.PI / 2]}>
          <CylinderCollider args={[5, 1]} />
          <mesh receiveShadow>
            <cylinderGeometry args={[1, 1, 10]} />
            <meshStandardMaterial color="moccasin" />
          </mesh>
        </group>
      </RigidBody>
    </group>
  );
}
