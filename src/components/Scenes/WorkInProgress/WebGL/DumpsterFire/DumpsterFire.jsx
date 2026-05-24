import React from 'react';

import useLoopedSceneAudio from '../../../../../hooks/useLoopedSceneAudio';
import FireAndSmokeLayer from './components/FireAndSmokeLayer';
import PhysicsScene from './components/PhysicsScene';
import SceneEnvironment from './components/SceneEnvironment';
import TrashBlasterOverlay from './components/TrashBlasterOverlay';
import useDumpsterFireCollisionAudio from './hooks/useDumpsterFireCollisionAudio';
import useSceneControls from './hooks/useSceneControls';
import { FIRE_LOOP_TRACK, FIRE_LOOP_VOLUME } from './utils/sceneData';

export default function DumpsterFire() {
  useLoopedSceneAudio(FIRE_LOOP_TRACK, { volume: FIRE_LOOP_VOLUME });
  const { playCollision } = useDumpsterFireCollisionAudio();
  const {
    fireAndSmokeInstances,
    showEffects,
    editSplines,
    setFireAndSmokePoints,
  } = useSceneControls();

  return (
    <>
      <SceneEnvironment />
      <PhysicsScene onTrashCollision={playCollision} />
      <FireAndSmokeLayer
        instances={fireAndSmokeInstances}
        showEffects={showEffects}
        editSplines={editSplines}
        setFireAndSmokePoints={setFireAndSmokePoints}
      />
      <TrashBlasterOverlay />
    </>
  );
}
