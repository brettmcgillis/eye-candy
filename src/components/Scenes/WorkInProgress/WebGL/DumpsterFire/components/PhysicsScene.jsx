import React from 'react';

import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier';

import {
  DYNAMIC_SCENE_ITEMS,
  FIXED_SCENE_ITEMS,
  FLOOR_COLLIDER_HALF_EXTENTS,
  FLOOR_COLLIDER_POSITION,
  SCENE_ROOT_POSITION,
} from '../utils/sceneData';
import { getSceneItemKey } from '../utils/sceneUtils';
import { DynamicSceneAsset, FixedSceneAsset } from './SceneAssetRigidBody';
import TrashBlaster from './TrashBlaster';

function SceneComposition({ onTrashCollision }) {
  return (
    <group position={SCENE_ROOT_POSITION}>
      {FIXED_SCENE_ITEMS.map((item) => {
        const { PhysicsComponent } = item;

        if (PhysicsComponent) {
          return (
            <PhysicsComponent
              key={getSceneItemKey(item)}
              item={item}
              onCollisionEnter={onTrashCollision}
            />
          );
        }

        return (
          <FixedSceneAsset
            key={getSceneItemKey(item)}
            item={item}
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

      <SceneComposition onTrashCollision={onTrashCollision} />
      <TrashBlaster shotConfig={shotConfig} />
    </Physics>
  );
});

export default PhysicsScene;
