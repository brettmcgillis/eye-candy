import React from 'react';

import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier';

import {
  DECOR_RUG,
  DECOR_RUG_COLLIDER_POSITION,
  DYNAMIC_SCENE_ITEMS,
  FIXED_SCENE_ITEMS,
  GROUND_Y,
  SCENE_ROOT_POSITION,
  SIDEWALK_TILE_SIZE,
} from '../utils/sceneData';
import { getSceneItemKey } from '../utils/sceneUtils';
import DumpsterBrickWall from './DumpsterBrickWall';
import { DynamicSceneAsset, FixedSceneAsset } from './SceneAssetRigidBody';
import TrashBlaster from './TrashBlaster';

const SIDEWALK_COLLIDER_HALF_HEIGHT = 0.25;

// Mirrors SidewalkGround's tiling so the collider covers exactly the paved
// footprint. A 90deg/270deg rotation swaps the width/depth spans.
function getSidewalkColliderShape(config) {
  if (!config?.enabled) {
    return null;
  }

  const position = config.position ?? {};
  const length = config.length ?? 0;
  const rows = Math.max(1, Math.round(config.rows ?? 1));
  const columns = Math.max(1, Math.round(length / SIDEWALK_TILE_SIZE.width));

  let spanX = columns * SIDEWALK_TILE_SIZE.width;
  let spanZ = rows * SIDEWALK_TILE_SIZE.depth;

  if (config.rotationDeg === 90 || config.rotationDeg === 270) {
    [spanX, spanZ] = [spanZ, spanX];
  }

  const topY = position.y ?? GROUND_Y;

  return {
    halfExtents: [spanX / 2, SIDEWALK_COLLIDER_HALF_HEIGHT, spanZ / 2],
    position: [
      position.x ?? 0,
      topY - SIDEWALK_COLLIDER_HALF_HEIGHT,
      position.z ?? 0,
    ],
  };
}

function SceneComposition({
  brickWallConfig,
  dumpsterConfig,
  onTrashCollision,
}) {
  return (
    <group position={SCENE_ROOT_POSITION}>
      <DumpsterBrickWall
        config={brickWallConfig}
        onTrashCollision={onTrashCollision}
      />

      {FIXED_SCENE_ITEMS.map((item) => {
        const sceneItem =
          item.key === 'dumpster'
            ? {
                ...item,
                componentProps: {
                  ...item.componentProps,
                  leftLidRotation:
                    dumpsterConfig?.leftLidRotation ??
                    item.componentProps?.leftLidRotation,
                  rightLidRotation:
                    dumpsterConfig?.rightLidRotation ??
                    item.componentProps?.rightLidRotation,
                },
              }
            : item;
        const { PhysicsComponent } = sceneItem;

        if (PhysicsComponent) {
          return (
            <PhysicsComponent
              key={getSceneItemKey(sceneItem)}
              item={sceneItem}
              onCollisionEnter={onTrashCollision}
            />
          );
        }

        return (
          <FixedSceneAsset
            key={getSceneItemKey(sceneItem)}
            item={sceneItem}
            onCollisionEnter={onTrashCollision}
          />
        );
      })}

      {DYNAMIC_SCENE_ITEMS.map((item) => (
        <DynamicSceneAsset key={getSceneItemKey(item)} item={item} />
      ))}
    </group>
  );
}

const PhysicsScene = React.memo(function PhysicsScene({
  brickWallConfig,
  dumpsterConfig,
  sidewalkGroundConfig,
  debug = true,
  onTrashCollision,
  shotConfig,
}) {
  const sidewalkCollider = getSidewalkColliderShape(sidewalkGroundConfig);

  return (
    <Physics timeStep={1 / 60} interpolate debug={debug}>
      {sidewalkCollider && (
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider
            args={sidewalkCollider.halfExtents}
            position={sidewalkCollider.position}
            friction={1.4}
            restitution={0.05}
            onCollisionEnter={onTrashCollision}
          />
        </RigidBody>
      )}

      <RigidBody
        type="fixed"
        colliders={false}
        position={DECOR_RUG_COLLIDER_POSITION}
        rotation={DECOR_RUG.rotation}
      >
        <CuboidCollider
          args={DECOR_RUG.colliderHalfExtents}
          friction={1.6}
          restitution={0.02}
        />
      </RigidBody>

      <SceneComposition
        brickWallConfig={brickWallConfig}
        dumpsterConfig={dumpsterConfig}
        onTrashCollision={onTrashCollision}
      />
      <TrashBlaster shotConfig={shotConfig} />
    </Physics>
  );
});

export default PhysicsScene;
