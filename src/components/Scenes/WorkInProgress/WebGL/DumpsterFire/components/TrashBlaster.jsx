import React, { useEffect, useMemo, useRef } from 'react';

import { InstancedRigidBodies, RigidBody } from '@react-three/rapier';

import useInstancedTrashVisual from '../hooks/useInstancedTrashVisual';
import useTrashBlaster from '../hooks/useTrashBlaster';
import {
  SHOT_ASSET_OPTIONS,
  SHOT_POOL_SLOTS_PER_ASSET,
} from '../utils/sceneData';
import { getParkedShotPosition } from '../utils/sceneUtils';

function InstancedTrashBodies({ asset, bodyRefsMap }) {
  const bodyRefsStore = bodyRefsMap.current;
  const { geometry, material } = useInstancedTrashVisual(asset.key);
  const bodiesRef = useRef([]);

  const instances = useMemo(
    () =>
      Array.from({ length: SHOT_POOL_SLOTS_PER_ASSET }, (_, slotIndex) => ({
        key: `${asset.key}-shot-slot-${slotIndex}`,
        position: getParkedShotPosition(asset.key, slotIndex),
        rotation: [0, 0, 0],
        scale: asset.scale ?? 1,
        mass: asset.mass ?? 0.5,
      })),
    [asset.key, asset.mass, asset.scale]
  );

  useEffect(() => {
    bodyRefsStore[asset.key] = bodiesRef.current;

    return () => {
      delete bodyRefsStore[asset.key];
    };
  }, [asset.key, bodyRefsStore]);

  return (
    <InstancedRigidBodies
      instances={instances}
      colliders={asset.colliders ?? 'cuboid'}
      mass={asset.mass ?? 0.5}
      friction={1.2}
      restitution={0.08}
      linearDamping={1.2}
      angularDamping={1.6}
      canSleep
      ccd
      ref={bodiesRef}
    >
      <instancedMesh
        castShadow
        receiveShadow
        frustumCulled={false}
        args={[geometry, material, instances.length]}
        count={instances.length}
      />
    </InstancedRigidBodies>
  );
}

function ComponentTrashBodies({ asset, bodyRefsMap }) {
  const bodyRefsStore = bodyRefsMap.current;
  const bodiesRef = useRef([]);
  const { Component } = asset;

  const instances = useMemo(
    () =>
      Array.from({ length: SHOT_POOL_SLOTS_PER_ASSET }, (_, slotIndex) => ({
        key: `${asset.key}-shot-slot-${slotIndex}`,
        position: getParkedShotPosition(asset.key, slotIndex),
        rotation: [0, 0, 0],
      })),
    [asset.key]
  );

  useEffect(() => {
    bodyRefsStore[asset.key] = bodiesRef.current;

    return () => {
      delete bodyRefsStore[asset.key];
    };
  }, [asset.key, bodyRefsStore]);

  return instances.map((instance, slotIndex) => (
    <RigidBody
      key={instance.key}
      colliders={asset.colliders ?? 'cuboid'}
      position={instance.position}
      rotation={instance.rotation}
      scale={asset.scale ?? 1}
      mass={asset.mass ?? 0.5}
      friction={1.2}
      restitution={0.08}
      linearDamping={1.2}
      angularDamping={1.6}
      canSleep
      ccd
      ref={(body) => {
        bodiesRef.current[slotIndex] = body;
      }}
    >
      <Component />
    </RigidBody>
  ));
}

export default function TrashBlaster() {
  const shotBodiesRef = useTrashBlaster();

  return SHOT_ASSET_OPTIONS.map((asset) =>
    asset.poolType === 'component' ? (
      <ComponentTrashBodies
        key={asset.key}
        asset={asset}
        bodyRefsMap={shotBodiesRef}
      />
    ) : (
      <InstancedTrashBodies
        key={asset.key}
        asset={asset}
        bodyRefsMap={shotBodiesRef}
      />
    )
  );
}
