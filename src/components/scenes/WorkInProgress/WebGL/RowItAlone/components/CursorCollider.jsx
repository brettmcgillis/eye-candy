import * as THREE from 'three';

import React, { useRef } from 'react';

import { useFrame } from '@react-three/fiber';
import {
  BallCollider,
  RigidBody,
  interactionGroups,
} from '@react-three/rapier';

const hiddenPosition = new THREE.Vector3(0, -1000, 0);
const targetPosition = new THREE.Vector3();
const OAR_COLLISION_GROUP = 1;
const CURSOR_COLLISION_GROUP = 2;

export default function CursorCollider({ interaction, runtime }) {
  const bodyRef = useRef();

  useFrame(() => {
    const body = bodyRef.current;
    const pointerTarget = runtime.pointerTargetRef.current;

    if (!body) {
      return;
    }

    if (!interaction.cursorColliderEnabled || !pointerTarget.active) {
      hiddenPosition.y = interaction.cursorParkY;
      body.setNextKinematicTranslation(hiddenPosition);

      return;
    }

    targetPosition.set(
      pointerTarget.x,
      runtime.sampleHeight(pointerTarget.x, pointerTarget.z) +
        interaction.cursorHover,
      pointerTarget.z
    );

    body.setNextKinematicTranslation(targetPosition);
  });

  return (
    <RigidBody
      ref={bodyRef}
      collisionGroups={interactionGroups(CURSOR_COLLISION_GROUP, [
        OAR_COLLISION_GROUP,
      ])}
      colliders={false}
      enabledRotations={[false, false, false]}
      position={[0, interaction.cursorParkY, 0]}
      solverGroups={interactionGroups(CURSOR_COLLISION_GROUP, [
        OAR_COLLISION_GROUP,
      ])}
      type="kinematicPosition"
    >
      <BallCollider args={[interaction.cursorColliderRadius]} friction={0.2} />
      {interaction.showCursorCollider && (
        <mesh castShadow>
          <sphereGeometry args={[interaction.cursorColliderRadius, 24, 24]} />
          <meshBasicMaterial color="#b6efff" opacity={0.45} transparent />
        </mesh>
      )}
    </RigidBody>
  );
}
