import React from 'react';

import AudioToggleOverlay from '../../../../../app/scaffold/overlay/components/AudioToggleOverlay';
import useLoopedSceneAudio from '../../../../../hooks/useLoopedSceneAudio';
import AssetShowcaseGrid from './components/AssetShowcaseGrid';
import PhysicsScene from './components/PhysicsScene';
import SceneEnvironment from './components/SceneEnvironment';
import { FIRE_LOOP_TRACK, FIRE_LOOP_VOLUME } from './utils/sceneData';

export default function DumpsterFire() {
  useLoopedSceneAudio(FIRE_LOOP_TRACK, { volume: FIRE_LOOP_VOLUME });

  return (
    <>
      <SceneEnvironment />
      <AssetShowcaseGrid />
      <PhysicsScene />
      <AudioToggleOverlay />
    </>
  );
}
