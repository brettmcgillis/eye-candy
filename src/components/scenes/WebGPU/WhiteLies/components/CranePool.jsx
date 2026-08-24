import React, { memo, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';
import { InstancedRigidBodies } from '@react-three/rapier';

import * as THREE from 'three/webgpu';

import {
  PaperCraneBodyInstance,
  PaperCraneBodyInstances,
} from '@elements/PaperCrane/PaperCrane';

import {
  buildCraneGrid,
  getRandomEuler,
  getRandomTopSpawnPosition,
  isOutsideRoom,
} from '../utils/sceneUtils';

const RESPAWN_BATCH_SIZE = 6;
const sharedQuaternion = new THREE.Quaternion();
const sharedEuler = new THREE.Euler();
const sharedRay = new THREE.Ray();
const sharedRayOrigin = new THREE.Vector3();
const sharedRayDirection = new THREE.Vector3();
const sharedBallPosition = new THREE.Vector3();
const sharedClosestPoint = new THREE.Vector3();
const sharedPushDirection = new THREE.Vector3();

function buildInstances(craneCount, craneScale) {
  const positions = buildCraneGrid(craneCount, craneScale);

  return positions.map((position, index) => ({
    key: `crane-${index}`,
    position,
    rotation: getRandomEuler(),
    scale: craneScale,
  }));
}

function respawnBody(body, craneScale) {
  const [x, y, z] = getRandomTopSpawnPosition(craneScale);
  const [rx, ry, rz] = getRandomEuler();
  sharedEuler.set(rx, ry, rz);
  sharedQuaternion.setFromEuler(sharedEuler);

  body.setTranslation({ x, y, z }, true);
  body.setRotation(
    {
      x: sharedQuaternion.x,
      y: sharedQuaternion.y,
      z: sharedQuaternion.z,
      w: sharedQuaternion.w,
    },
    true
  );
  body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  body.wakeUp?.();
}

// Instances a single paper-crane body mesh (see elements/PaperCrane) as a
// tumbling flock of lightweight rigid bodies. The fold-line/shadow detail
// layers are skipped here for a single-draw-call flock — see PaperCrane.jsx
// for the fully detailed single-copy prop.
function CranePool({ craneCount, craneScale, interaction, physics }) {
  const bodiesRef = useRef([]);
  const lastSpawnNonceRef = useRef(0);

  const instances = useMemo(
    () => buildInstances(craneCount, craneScale),
    [craneCount, craneScale]
  );

  useFrame(() => {
    const bodies = bodiesRef.current;
    if (!bodies.length) return;

    const state = interaction.stateRef.current;

    if (state.spawnNonce !== lastSpawnNonceRef.current) {
      lastSpawnNonceRef.current = state.spawnNonce;

      for (let i = 0; i < RESPAWN_BATCH_SIZE; i += 1) {
        const body = bodies[Math.floor(Math.random() * bodies.length)];
        if (body) respawnBody(body, craneScale);
      }
    }

    if (state.pointerActive) {
      sharedRayOrigin.set(state.rayOriginX, state.rayOriginY, state.rayOriginZ);
      sharedRayDirection.set(state.rayDirX, state.rayDirY, state.rayDirZ);
      sharedRay.set(sharedRayOrigin, sharedRayDirection);
    }

    bodies.forEach((body) => {
      if (!body) return;

      const translation = body.translation();
      sharedBallPosition.set(translation.x, translation.y, translation.z);

      if (isOutsideRoom(sharedBallPosition)) {
        respawnBody(body, craneScale);
        return;
      }

      if (!state.pointerActive) return;

      sharedRay.closestPointToPoint(sharedBallPosition, sharedClosestPoint);
      const distance = sharedClosestPoint.distanceTo(sharedBallPosition);

      if (distance >= physics.pushRadius) return;

      sharedPushDirection.subVectors(sharedBallPosition, sharedClosestPoint);
      if (sharedPushDirection.lengthSq() < 0.0001) {
        sharedPushDirection.set(0, 1, 0);
      } else {
        sharedPushDirection.normalize();
      }

      const strength =
        physics.pushStrength * (1 - distance / physics.pushRadius);

      body.applyImpulse(
        {
          x: sharedPushDirection.x * strength,
          y: sharedPushDirection.y * strength,
          z: sharedPushDirection.z * strength,
        },
        true
      );
    });
  });

  return (
    <InstancedRigidBodies
      ref={bodiesRef}
      angularDamping={physics.angularDamping}
      canSleep
      ccd
      colliders="hull"
      friction={physics.friction}
      instances={instances}
      linearDamping={physics.linearDamping}
      mass={physics.mass}
      restitution={physics.restitution}
    >
      <PaperCraneBodyInstances
        castShadow
        frames={1}
        frustumCulled={false}
        limit={instances.length}
        range={instances.length}
        receiveShadow
      >
        {instances.map((instance) => (
          <PaperCraneBodyInstance
            key={instance.key}
            position={instance.position}
            rotation={instance.rotation}
            scale={instance.scale}
          />
        ))}
      </PaperCraneBodyInstances>
    </InstancedRigidBodies>
  );
}

export default memo(CranePool);
