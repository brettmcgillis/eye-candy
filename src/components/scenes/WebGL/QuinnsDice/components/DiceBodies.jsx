/* eslint-disable no-param-reassign */
import React, { useEffect, useMemo, useRef } from 'react';

import { Center } from '@react-three/drei';
import { CuboidCollider, RigidBody } from '@react-three/rapier';

import QuinnsD4 from '@elements/quinnsDice/QuinnsD4';
import QuinnsD6 from '@elements/quinnsDice/QuinnsD6';
import QuinnsD8 from '@elements/quinnsDice/QuinnsD8';
import QuinnsD10 from '@elements/quinnsDice/QuinnsD10';
import QuinnsD12 from '@elements/quinnsDice/QuinnsD12';
import QuinnsD20 from '@elements/quinnsDice/QuinnsD20';

import { DICE_CONFIGS } from '../presets/QuinnsDice.sceneSettings';

export const SceneBounds = React.memo(function SceneBounds({
  width = 30,
  height = 30,
  depth = 30,
  onBottomCollisionEnter,
}) {
  const halfW = width / 2;
  const halfH = height / 2;
  const halfD = depth / 2;
  const wallThickness = 0.5;

  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider
        args={[halfW, wallThickness, halfD]}
        position={[0, halfH, 0]}
      />
      <CuboidCollider
        args={[halfW, wallThickness, halfD]}
        position={[0, -halfH, 0]}
        friction={1}
        restitution={0}
        onCollisionEnter={onBottomCollisionEnter}
      />
      <CuboidCollider
        args={[wallThickness, halfH, halfD]}
        position={[halfW, 0, 0]}
      />
      <CuboidCollider
        args={[wallThickness, halfH, halfD]}
        position={[-halfW, 0, 0]}
      />
      <CuboidCollider
        args={[halfW, halfH, wallThickness]}
        position={[0, 0, halfD]}
      />
      <CuboidCollider
        args={[halfW, halfH, wallThickness]}
        position={[0, 0, -halfD]}
      />

      {/* Shadow catcher on the lowest collision plane to make die landings readable */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -halfH + wallThickness + 0.001, 0]}
      >
        <planeGeometry args={[100, 100]} />
        <shadowMaterial transparent opacity={0.3} />
      </mesh>
    </RigidBody>
  );
});

function DieBody({
  name,
  position,
  children,
  rigidScale = 1,
  bodyRef,
  linearDamping = 4,
  angularDamping = 1,
  friction = 0.1,
  colliders = false,
  restitution = 0.05,
  softCcdPrediction = 0.35,
}) {
  const internalRef = useRef();
  const api = bodyRef || internalRef;
  const pos = useMemo(() => position || [0, 0, 0], [position]);
  return (
    <RigidBody
      key={`${name}-${rigidScale}`}
      name={name}
      linearDamping={linearDamping}
      angularDamping={angularDamping}
      friction={friction}
      restitution={restitution}
      position={pos}
      scale={rigidScale}
      ref={api}
      colliders={colliders}
      canSleep
      ccd
      softCcdPrediction={softCcdPrediction}
    >
      {children}
    </RigidBody>
  );
}

export const D4Die = React.memo(function D4Die({
  scale = 1,
  bodyRef,
  ...props
}) {
  const { position } = DICE_CONFIGS[0];
  return (
    <DieBody
      name="d4"
      position={position}
      rigidScale={scale}
      bodyRef={bodyRef}
      colliders="hull"
      {...props}
    >
      <Center>
        <QuinnsD4 />
      </Center>
    </DieBody>
  );
});

export const D6Die = React.memo(function D6Die({
  scale = 1,
  bodyRef,
  ...props
}) {
  const { position } = DICE_CONFIGS[1];
  return (
    <DieBody
      name="d6"
      position={position}
      rigidScale={scale}
      bodyRef={bodyRef}
      colliders="hull"
      {...props}
    >
      <Center>
        <QuinnsD6 />
      </Center>
    </DieBody>
  );
});

export const D8Die = React.memo(function D8Die({
  scale = 1,
  bodyRef,
  ...props
}) {
  const { position } = DICE_CONFIGS[2];
  return (
    <DieBody
      name="d8"
      position={position}
      rigidScale={scale}
      bodyRef={bodyRef}
      colliders="hull"
      {...props}
    >
      <Center>
        <QuinnsD8 />
      </Center>
    </DieBody>
  );
});

export const D10Die = React.memo(function D10Die({
  scale = 1,
  bodyRef,
  ...props
}) {
  const { position } = DICE_CONFIGS[3];
  return (
    <DieBody
      name="d10"
      position={position}
      rigidScale={scale}
      bodyRef={bodyRef}
      colliders="hull"
      {...props}
    >
      <Center>
        <QuinnsD10 />
      </Center>
    </DieBody>
  );
});

export const D12Die = React.memo(function D12Die({
  scale = 1,
  bodyRef,
  ...props
}) {
  const { position } = DICE_CONFIGS[4];
  return (
    <DieBody
      name="d12"
      position={position}
      rigidScale={scale}
      bodyRef={bodyRef}
      colliders="hull"
      {...props}
    >
      <Center>
        <QuinnsD12 />
      </Center>
    </DieBody>
  );
});

const D20Visual = React.memo(function D20Visual({
  emissiveColor = '#ffffff',
  emissiveIntensity = 1,
}) {
  const groupRef = useRef();

  useEffect(() => {
    const root = groupRef.current;
    if (!root) return;

    root.traverse((obj) => {
      if (!obj.isMesh) return;
      const mat = obj.material;
      if (!mat) return;
      if (mat.emissive) mat.emissive.set(emissiveColor);
      if ('emissiveIntensity' in mat) mat.emissiveIntensity = emissiveIntensity;
      mat.needsUpdate = true;
    });
  }, [emissiveColor, emissiveIntensity]);

  return (
    <group ref={groupRef}>
      <QuinnsD20 />
    </group>
  );
});

export const D20Die = React.memo(function D20Die({
  bodyRef,
  scale = 1,
  emissiveColor = '#ffffff',
  emissiveIntensity = 1,
  ...props
}) {
  const { position } = DICE_CONFIGS[5];
  return (
    <DieBody
      name="d20"
      position={position}
      rigidScale={scale}
      bodyRef={bodyRef}
      colliders="hull"
      {...props}
    >
      <Center>
        <D20Visual
          emissiveColor={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </Center>
    </DieBody>
  );
});
