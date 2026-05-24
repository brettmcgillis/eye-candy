import React from 'react';

import useLoopedSceneAudio from '../../../../../hooks/useLoopedSceneAudio';
import DebugDumpster from './components/DebugDumpster';
import PhysicsScene from './components/PhysicsScene';
import SceneEnvironment from './components/SceneEnvironment';
import TrashBlasterOverlay from './components/TrashBlasterOverlay';
import useDumpsterFireCollisionAudio from './hooks/useDumpsterFireCollisionAudio';
import { FIRE_LOOP_TRACK, FIRE_LOOP_VOLUME } from './utils/sceneData';

export default function DumpsterFire() {
  useLoopedSceneAudio(FIRE_LOOP_TRACK, { volume: FIRE_LOOP_VOLUME });
  const { playCollision } = useDumpsterFireCollisionAudio();

  return (
    <>
      <SceneEnvironment />
      <PhysicsScene onTrashCollision={playCollision} />
      <DebugDumpster />
      <TrashBlasterOverlay />
    </>
  );
}
