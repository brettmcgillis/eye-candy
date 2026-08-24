import React, { useEffect, useRef } from 'react';

import { RigidBody } from '@react-three/rapier';

import * as THREE from 'three';

import useTrashBlasterStore from '../hooks/useTrashBlasterStore';
import { SCENE_ROOT_POSITION } from '../utils/sceneData';
import { getSceneItemKey } from '../utils/sceneUtils';

const RESET_DROP_HEIGHT = 0.35;

function buildQuaternionFromRotation(rotation = [0, 0, 0]) {
  return new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation));
}

function getWorldScenePosition(position = [0, 0, 0]) {
  return {
    x: SCENE_ROOT_POSITION[0] + position[0],
    y: SCENE_ROOT_POSITION[1] + position[1],
    z: SCENE_ROOT_POSITION[2] + position[2],
  };
}

function resetDynamicBody(body, initialPosition, initialRotation) {
  if (!body) {
    return;
  }

  body.setTranslation(
    {
      ...initialPosition,
      y: initialPosition.y + RESET_DROP_HEIGHT,
    },
    true
  );
  body.setRotation(initialRotation, true);
  body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  body.wakeUp?.();
}

export function FixedSceneAsset({ item, onCollisionEnter }) {
  const {
    Component,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = 1,
    componentProps,
    colliders = 'cuboid',
    rigidBodyProps,
  } = item;

  return (
    <RigidBody
      type="fixed"
      colliders={colliders}
      position={position}
      rotation={rotation}
      scale={scale}
      friction={1.1}
      restitution={0.05}
      onCollisionEnter={onCollisionEnter}
      {...rigidBodyProps}
    >
      <Component {...componentProps} />
    </RigidBody>
  );
}

export function DynamicSceneAsset({ item, onCollisionEnter }) {
  const bodyRef = useRef(null);
  const interactiveRootRef = useRef(null);
  const registerInteractiveTarget = useTrashBlasterStore(
    (s) => s.registerInteractiveTarget
  );
  const unregisterInteractiveTarget = useTrashBlasterStore(
    (s) => s.unregisterInteractiveTarget
  );
  const cleanupNonce = useTrashBlasterStore((s) => s.cleanupNonce);
  const {
    Component,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = 1,
    componentProps,
    colliders = 'cuboid',
    mass = 0.5,
    rigidBodyProps,
  } = item;
  const targetId = `dynamic-scene-${getSceneItemKey(item)}`;
  const initialPositionRef = useRef(getWorldScenePosition(position));
  const initialRotationRef = useRef(buildQuaternionFromRotation(rotation));

  useEffect(() => {
    registerInteractiveTarget(targetId, {
      getObject: () => interactiveRootRef.current,
      buildSession: ({ intersection, clientX, clientY }) => {
        const body = bodyRef.current;

        if (!body) {
          return null;
        }

        return {
          kind: 'body',
          body,
          point: intersection.point.clone(),
          clientX,
          clientY,
        };
      },
    });

    return () => {
      unregisterInteractiveTarget(targetId);
    };
  }, [registerInteractiveTarget, targetId, unregisterInteractiveTarget]);

  useEffect(() => {
    if (cleanupNonce === 0) {
      return;
    }

    resetDynamicBody(
      bodyRef.current,
      initialPositionRef.current,
      initialRotationRef.current
    );
  }, [cleanupNonce]);

  const spawnPosition = [
    position[0],
    position[1] + RESET_DROP_HEIGHT,
    position[2],
  ];

  return (
    <RigidBody
      ref={bodyRef}
      colliders={colliders}
      position={spawnPosition}
      rotation={rotation}
      scale={scale}
      mass={mass}
      friction={1.2}
      restitution={0.08}
      linearDamping={1.2}
      angularDamping={1.6}
      canSleep
      ccd
      userData={{ isFlammableTrash: true }}
      onCollisionEnter={onCollisionEnter}
      {...rigidBodyProps}
    >
      <group ref={interactiveRootRef}>
        <Component {...componentProps} />
      </group>
    </RigidBody>
  );
}
