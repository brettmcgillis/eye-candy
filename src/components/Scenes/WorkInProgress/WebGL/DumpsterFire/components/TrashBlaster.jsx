import React, { useEffect, useMemo, useRef } from 'react';

import { InstancedRigidBodies } from '@react-three/rapier';

import useTrashBlaster from '../hooks/useTrashBlaster';
import useTrashBlasterStore from '../hooks/useTrashBlasterStore';
import {
  SHOT_ASSET_OPTIONS,
  SHOT_POOL_SLOTS_PER_ASSET,
  TRASH_CLEANUP_PLANE_SIZE,
  TRASH_CLEANUP_POSITION,
} from '../utils/sceneData';
import { getParkedShotPosition } from '../utils/sceneUtils';

function createShotInstances(asset) {
  return Array.from({ length: SHOT_POOL_SLOTS_PER_ASSET }, (_, slotIndex) => ({
    key: `${asset.key}-shot-slot-${slotIndex}`,
    position: getParkedShotPosition(asset.key, slotIndex),
    rotation: [0, 0, 0],
    scale: asset.scale ?? 1,
    mass: asset.mass ?? 0.5,
    userData: {
      assetKey: asset.key,
      slotIndex,
      isTrashProjectile: true,
      isActiveThrowable: false,
    },
  }));
}

function CleanupPlane() {
  return (
    <mesh
      visible={false}
      position={TRASH_CLEANUP_POSITION}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={TRASH_CLEANUP_PLANE_SIZE} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

function InstancedTrashBodies({ asset, bodyRefsMap }) {
  const bodyRefsStore = bodyRefsMap.current;
  const bodiesRef = useRef([]);
  const interactiveRootRef = useRef(null);
  const registerInteractiveTarget = useTrashBlasterStore(
    (s) => s.registerInteractiveTarget
  );
  const unregisterInteractiveTarget = useTrashBlasterStore(
    (s) => s.unregisterInteractiveTarget
  );
  const { InstanceComponent, InstancesComponent } = asset;

  if (!InstancesComponent || !InstanceComponent) {
    throw new Error(`Missing instances API for ${asset.key}`);
  }

  const instances = useMemo(
    () => createShotInstances(asset),
    [asset.key, asset.mass, asset.scale]
  );

  useEffect(() => {
    bodyRefsStore[asset.key] = bodiesRef.current;

    return () => {
      delete bodyRefsStore[asset.key];
    };
  }, [asset.key, bodyRefsStore]);

  useEffect(() => {
    const targetId = `shot-pool-${asset.key}`;

    registerInteractiveTarget(targetId, {
      getObject: () => interactiveRootRef.current,
      buildSession: ({ intersection, clientX, clientY }) => {
        const instanceId = intersection.instanceId;

        if (!Number.isInteger(instanceId)) {
          return null;
        }

        const body = bodiesRef.current[instanceId];

        if (!body?.userData?.isActiveThrowable) {
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
  }, [asset.key, registerInteractiveTarget, unregisterInteractiveTarget]);

  return (
    <group ref={interactiveRootRef}>
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
        <InstancesComponent
          castShadow
          receiveShadow
          frustumCulled={false}
          limit={instances.length}
          range={instances.length}
          frames={1}
        >
          {instances.map((instance) => (
            <InstanceComponent
              key={instance.key}
              position={instance.position}
              rotation={instance.rotation}
              scale={instance.scale}
            />
          ))}
        </InstancesComponent>
      </InstancedRigidBodies>
    </group>
  );
}

export default function TrashBlaster() {
  const { shotBodiesRef } = useTrashBlaster();

  return (
    <>
      <CleanupPlane />

      {SHOT_ASSET_OPTIONS.map((asset) => (
        <InstancedTrashBodies
          key={asset.key}
          asset={asset}
          bodyRefsMap={shotBodiesRef}
        />
      ))}
    </>
  );
}
