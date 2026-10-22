import React, { useEffect, useMemo, useRef } from 'react';

import { InstancedRigidBodies } from '@react-three/rapier';

import { layoutWall } from '@modules/dumpsterFire';
import { useCinderblocks } from '@modules/dumpsterFireRender';

import useTrashBlasterStore from '../hooks/useTrashBlasterStore';

const WALL_BLOCK_MASS = 0.9;

function BrickWallBatch({ batch, onCollisionEnter }) {
  const bodiesRef = useRef([]);
  const interactiveRootRef = useRef(null);
  const registerInteractiveTarget = useTrashBlasterStore(
    (s) => s.registerInteractiveTarget
  );
  const unregisterInteractiveTarget = useTrashBlasterStore(
    (s) => s.unregisterInteractiveTarget
  );

  useEffect(() => {
    const targetId = `brick-wall-${batch.key}`;

    registerInteractiveTarget(targetId, {
      getObject: () => interactiveRootRef.current,
      buildSession: ({ intersection, clientX, clientY }) => {
        const { instanceId } = intersection;

        if (!Number.isInteger(instanceId)) {
          return null;
        }

        const body = bodiesRef.current[instanceId];

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
  }, [batch.key, registerInteractiveTarget, unregisterInteractiveTarget]);

  return (
    <group ref={interactiveRootRef}>
      <InstancedRigidBodies
        colliders="cuboid"
        mass={WALL_BLOCK_MASS}
        friction={1.35}
        restitution={0.03}
        linearDamping={1.3}
        angularDamping={1.7}
        canSleep
        ccd
        instances={batch.instances}
        onCollisionEnter={onCollisionEnter}
        ref={bodiesRef}
      >
        <instancedMesh
          args={[batch.geometry, batch.material, batch.instances.length]}
          castShadow
          receiveShadow
          frustumCulled={false}
        />
      </InstancedRigidBodies>
    </group>
  );
}

// The generation's wall (@modules/dumpsterFire's layoutWall) as physics
// blocks: standing courses and rubble alike are dynamic, so the scene can
// knock them about.
export default function DumpsterBrickWall({ config, onTrashCollision }) {
  const cleanupNonce = useTrashBlasterStore((s) => s.cleanupNonce);
  const variants = useCinderblocks(config.brickWallTintColor ?? '#a35245');
  const blocks = useMemo(
    () => layoutWall(config),
    [
      config.brickWallCrumble,
      config.brickWallEnabled,
      config.brickWallHeight,
      config.brickWallHoles,
      config.brickWallLength,
      config.brickWallRubble,
      config.brickWallSeed,
    ]
  );
  const wallBatches = useMemo(
    () =>
      variants
        .map((variant) => ({
          ...variant,
          key: `cinderBlock${variant.index + 1}`,
          instances: blocks
            .filter((block) => block.variant === variant.index)
            .map((block) => ({
              key: `${variant.index}-${block.key}`,
              position: block.position,
              rotation: block.rotation,
              userData: { isFlammableTrash: true },
            })),
        }))
        .filter((batch) => batch.instances.length > 0),
    [blocks, variants]
  );

  if (!config.brickWallEnabled || wallBatches.length === 0) {
    return null;
  }

  return (
    <group position={config.position ?? [0, 0, 0]}>
      {wallBatches.map((batch) => (
        <BrickWallBatch
          key={`${cleanupNonce}-${batch.key}-${batch.instances.length}`}
          batch={batch}
          onCollisionEnter={onTrashCollision}
        />
      ))}
    </group>
  );
}
