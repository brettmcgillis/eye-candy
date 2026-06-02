import React from 'react';

import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier';

import {
  DECOR_RUG,
  DECOR_RUG_COLLIDER_POSITION,
  DYNAMIC_SCENE_ITEMS,
  FIXED_SCENE_ITEMS,
  FLOOR_COLLIDER_HALF_EXTENTS,
  FLOOR_COLLIDER_POSITION,
  SCENE_ROOT_POSITION,
} from '../utils/sceneData';
import { getSceneItemKey } from '../utils/sceneUtils';
import DumpsterBrickWall from './DumpsterBrickWall';
import { DynamicSceneAsset, FixedSceneAsset } from './SceneAssetRigidBody';
import TrashBlaster from './TrashBlaster';

function SceneComposition({
  brickWallConfig,
  dumpsterConfig,
  onTrashCollision,
}) {
  return (
    <group position={SCENE_ROOT_POSITION}>
      <DumpsterBrickWall config={brickWallConfig} />

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
  debug = true,
  onTrashCollision,
  shotConfig,
}) {
  return (
    <Physics timeStep={1 / 60} interpolate debug={debug}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          args={FLOOR_COLLIDER_HALF_EXTENTS}
          position={FLOOR_COLLIDER_POSITION}
          friction={1.4}
          restitution={0.05}
          onCollisionEnter={onTrashCollision}
        />
      </RigidBody>

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
