import { useControls } from 'leva';

import React, { useCallback } from 'react';

import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier';

import useSceneAudioStore from '../../../../../store/useSceneAudioStore';
import useDumpsterFireCollisionAudio from '../../../WorkInProgress/WebGL/DumpsterFire/hooks/useDumpsterFireCollisionAudio';
import AssetShowcaseGrid from './components/AssetShowcaseGrid';
import SceneEnvironment from './components/SceneEnvironment';
import { GROUND, GROUND_POSITION } from './utils/sceneData';

const GROUND_COLLIDER_HALF_HEIGHT = 0.05;
const GROUND_COLLIDER_HALF_EXTENTS = [
  GROUND.size[0] / 2,
  GROUND_COLLIDER_HALF_HEIGHT,
  GROUND.size[1] / 2,
];
const GROUND_COLLIDER_POSITION = [
  GROUND_POSITION[0],
  GROUND_POSITION[1] - GROUND_COLLIDER_HALF_HEIGHT,
  GROUND_POSITION[2],
];

export default function TrashCollector() {
  const { physicsDebug } = useControls('Trash Collector', {
    physicsDebug: { value: false, label: 'Physics Debug' },
  });
  const audioEnabled = useSceneAudioStore((s) => s.audioEnabled);
  const toggleAudio = useSceneAudioStore((s) => s.toggleAudio);
  const { playAssetPreview } = useDumpsterFireCollisionAudio();

  const handleAssetPreview = useCallback(
    (assetKey) => {
      if (!audioEnabled) {
        toggleAudio();
      }

      playAssetPreview(assetKey);
    },
    [audioEnabled, playAssetPreview, toggleAudio]
  );

  return (
    <>
      <SceneEnvironment />
      <Physics debug={physicsDebug} timeStep={1 / 60} interpolate>
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider
            args={GROUND_COLLIDER_HALF_EXTENTS}
            position={GROUND_COLLIDER_POSITION}
            friction={1.2}
            restitution={0.05}
          />
        </RigidBody>

        <AssetShowcaseGrid onAssetPreview={handleAssetPreview} />
      </Physics>
    </>
  );
}
