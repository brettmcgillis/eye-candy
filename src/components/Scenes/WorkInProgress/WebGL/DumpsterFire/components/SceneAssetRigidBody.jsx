import React from 'react';

import { RigidBody } from '@react-three/rapier';

export function FixedSceneAsset({ item }) {
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
      {...rigidBodyProps}
    >
      <Component {...componentProps} />
    </RigidBody>
  );
}

export function DynamicSceneAsset({ item }) {
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

  return (
    <RigidBody
      colliders={colliders}
      position={position}
      rotation={rotation}
      scale={scale}
      mass={mass}
      friction={1.2}
      restitution={0.08}
      linearDamping={1.2}
      angularDamping={1.6}
      canSleep
      ccd
      {...rigidBodyProps}
    >
      <Component {...componentProps} />
    </RigidBody>
  );
}
