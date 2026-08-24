import React, { useImperativeHandle, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';

import * as THREE from 'three';

import { PhysicalSingleRock, ROCK_VARIANT_COUNT } from '@elements/Rocks/Rocks';

import { SCENE_GROUND_Y } from '../utils/sceneLayout';

const MIN_COLLISION_STEP = 0.0001;
const PROJECTILE_CLEANUP_Y = SCENE_GROUND_Y - 12;
const PROJECTILE_PARK_X_SPACING = 0.32;
const PROJECTILE_PARK_Y = -60;
const PROJECTILE_POOL_SIZE = 18;
const PROJECTILE_SPAWN_OFFSET = 0.9;
const ROCK_ANGULAR_DAMPING = 1.8;
const ROCK_FRICTION = 1.15;
const ROCK_LINEAR_DAMPING = 1.15;
const ROCK_MASS = 0.26;
const ROCK_RESTITUTION = 0.08;
const ROCK_SWEEP_PADDING = 0.14;

const sharedCollisionDirection = new THREE.Vector3();
const sharedDirection = new THREE.Vector3();
const sharedImpactLocalPoint = new THREE.Vector3();
const sharedRaycaster = new THREE.Raycaster();
const sharedStartPosition = new THREE.Vector3();
const sharedTarget = new THREE.Vector3();
const sharedWorldPosition = new THREE.Vector3();

function createRockBodyState() {
  return {
    active: false,
    paneBroken: false,
    previousWorldPosition: new THREE.Vector3(),
  };
}

function getParkedRockPosition(slotIndex) {
  return [
    (slotIndex - (PROJECTILE_POOL_SIZE - 1) / 2) * PROJECTILE_PARK_X_SPACING,
    PROJECTILE_PARK_Y,
    0,
  ];
}

function getMeshHit(collisionObjects, startWorldPosition, endWorldPosition) {
  if (!collisionObjects.length) {
    return null;
  }

  sharedCollisionDirection.copy(endWorldPosition).sub(startWorldPosition);

  const segmentDistance = sharedCollisionDirection.length();

  if (segmentDistance <= MIN_COLLISION_STEP) {
    return null;
  }

  sharedRaycaster.set(startWorldPosition, sharedCollisionDirection.normalize());
  sharedRaycaster.far = segmentDistance + ROCK_SWEEP_PADDING;

  return sharedRaycaster.intersectObjects(collisionObjects, false)[0] ?? null;
}

function setThrowableActiveState(body, isActiveThrowable) {
  if (!body) {
    return;
  }

  const rigidBody = body;

  rigidBody.userData = {
    ...rigidBody.userData,
    isActiveThrowable,
  };
}

function parkRockBody(body, slotIndex) {
  if (!body) {
    return;
  }

  const rigidBody = body;
  const [x, y, z] = getParkedRockPosition(slotIndex);

  rigidBody.setTranslation({ x, y, z }, true);
  rigidBody.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
  rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
  rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
  setThrowableActiveState(rigidBody, false);
  rigidBody.sleep?.();
}

const PooledRockBody = React.memo(function PooledRockBody({
  bodyRefs,
  fluidObjectsRef,
  meshRefs,
  parkedPosition,
  rocks,
  slotIndex,
  variant,
}) {
  const bodyStore = bodyRefs.current;
  const fluidObjectsStore = fluidObjectsRef?.current ?? null;
  const meshStore = meshRefs.current;

  return (
    <RigidBody
      ref={(body) => {
        bodyStore[slotIndex] = body;

        if (body && !body.userData?.pooledRockInitialized) {
          const rigidBody = body;

          parkRockBody(rigidBody, slotIndex);
          rigidBody.userData = {
            ...rigidBody.userData,
            pooledRockInitialized: true,
          };
        }
      }}
      angularDamping={ROCK_ANGULAR_DAMPING}
      canSleep
      ccd
      colliders="hull"
      friction={ROCK_FRICTION}
      linearDamping={ROCK_LINEAR_DAMPING}
      mass={ROCK_MASS}
      position={parkedPosition}
      restitution={ROCK_RESTITUTION}
    >
      <group
        ref={(node) => {
          meshStore[slotIndex] = node;

          if (fluidObjectsStore) {
            fluidObjectsStore[slotIndex] = node;
          }
        }}
      >
        <PhysicalSingleRock scale={rocks.scale} variant={variant} />
      </group>
    </RigidBody>
  );
});

const RockProjectiles = React.forwardRef(function RockProjectiles(
  { collisionObjectsRef, fluidObjectsRef, onImpact, rocks, runtime },
  ref
) {
  const { camera } = useThree();
  const bodyRefs = useRef([]);
  const bodyStatesRef = useRef(
    Array.from({ length: PROJECTILE_POOL_SIZE }, createRockBodyState)
  );
  const lastResetNonceRef = useRef(runtime?.getResetNonce?.() ?? 0);
  const layerRef = useRef(null);
  const meshRefs = useRef([]);
  const nextSlotRef = useRef(0);
  const projectileSlots = useMemo(
    () =>
      Array.from({ length: PROJECTILE_POOL_SIZE }, (_, index) => ({
        parkedPosition: getParkedRockPosition(index),
        slotId: `tank-rock-body-${index}`,
        variant: index % ROCK_VARIANT_COUNT,
      })),
    []
  );

  useImperativeHandle(
    ref,
    () => ({
      launch({ targetWorldPoint }) {
        if (!layerRef.current) {
          return false;
        }

        const slotIndex = nextSlotRef.current;
        const body = bodyRefs.current[slotIndex];
        const slotState = bodyStatesRef.current[slotIndex];

        nextSlotRef.current = (slotIndex + 1) % PROJECTILE_POOL_SIZE;

        if (!body) {
          return false;
        }

        camera.getWorldDirection(sharedDirection);
        sharedStartPosition
          .copy(camera.position)
          .addScaledVector(sharedDirection, PROJECTILE_SPAWN_OFFSET);

        sharedTarget.copy(targetWorldPoint);
        sharedDirection.copy(sharedTarget).sub(sharedStartPosition);

        if (sharedDirection.lengthSq() <= MIN_COLLISION_STEP) {
          return false;
        }

        parkRockBody(body, slotIndex);

        body.setTranslation(
          {
            x: sharedStartPosition.x,
            y: sharedStartPosition.y,
            z: sharedStartPosition.z,
          },
          true
        );

        const rotation = new THREE.Euler(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        const quaternion = new THREE.Quaternion().setFromEuler(rotation);

        body.setRotation(
          {
            x: quaternion.x,
            y: quaternion.y,
            z: quaternion.z,
            w: quaternion.w,
          },
          true
        );

        sharedDirection.normalize().multiplyScalar(rocks.speed);
        body.setLinvel(
          {
            x: sharedDirection.x,
            y: sharedDirection.y,
            z: sharedDirection.z,
          },
          true
        );
        body.setAngvel(
          {
            x: THREE.MathUtils.randFloatSpread(rocks.spin),
            y: THREE.MathUtils.randFloatSpread(rocks.spin),
            z: THREE.MathUtils.randFloatSpread(rocks.spin),
          },
          true
        );
        setThrowableActiveState(body, true);
        body.wakeUp?.();

        slotState.active = true;
        slotState.paneBroken = false;
        slotState.previousWorldPosition.copy(sharedStartPosition);

        return true;
      },
    }),
    [camera, rocks.speed, rocks.spin]
  );

  useFrame(() => {
    const resetNonce = runtime?.getResetNonce?.() ?? 0;

    if (resetNonce !== lastResetNonceRef.current) {
      lastResetNonceRef.current = resetNonce;
      nextSlotRef.current = 0;

      bodyRefs.current.forEach((body, index) => {
        parkRockBody(body, index);
        bodyStatesRef.current[index].active = false;
        bodyStatesRef.current[index].paneBroken = false;
      });
    }

    bodyRefs.current.forEach((body, index) => {
      const mesh = meshRefs.current[index];
      const slotState = bodyStatesRef.current[index];

      if (!body || !mesh || !slotState.active) {
        return;
      }

      mesh.getWorldPosition(sharedWorldPosition);

      if (
        !slotState.paneBroken &&
        sharedWorldPosition.distanceToSquared(slotState.previousWorldPosition) >
          MIN_COLLISION_STEP * MIN_COLLISION_STEP
      ) {
        const meshHit = getMeshHit(
          collisionObjectsRef?.current ?? [],
          slotState.previousWorldPosition,
          sharedWorldPosition
        );
        const fragmentImpactHandler =
          meshHit?.object?.userData?.onProjectileImpact ?? null;
        const paneKey = meshHit?.object?.userData?.paneKey ?? null;
        const surfaceType = meshHit?.object?.userData?.surfaceType ?? null;

        if (
          surfaceType === 'tank-pane' &&
          paneKey &&
          !runtime?.isPaneBroken?.(paneKey)
        ) {
          meshHit.object.worldToLocal(
            sharedImpactLocalPoint.copy(meshHit.point)
          );
          onImpact?.(paneKey, {
            localPoint: sharedImpactLocalPoint.clone(),
            worldPoint: meshHit.point.clone(),
          });
          slotState.paneBroken = true;
        } else if (
          surfaceType === 'tank-pane-fragment' &&
          typeof fragmentImpactHandler === 'function'
        ) {
          fragmentImpactHandler(meshHit.point.clone());
          slotState.paneBroken = true;
        }
      }

      slotState.previousWorldPosition.copy(sharedWorldPosition);

      if (body.translation().y < PROJECTILE_CLEANUP_Y) {
        parkRockBody(body, index);
        slotState.active = false;
        slotState.paneBroken = false;
      }
    });
  });

  return (
    <group ref={layerRef}>
      {projectileSlots.map(({ parkedPosition, slotId, variant }, index) => (
        <PooledRockBody
          key={slotId}
          bodyRefs={bodyRefs}
          fluidObjectsRef={fluidObjectsRef}
          meshRefs={meshRefs}
          parkedPosition={parkedPosition}
          rocks={rocks}
          slotIndex={index}
          variant={variant}
        />
      ))}
    </group>
  );
});

RockProjectiles.displayName = 'RockProjectiles';

export default RockProjectiles;
