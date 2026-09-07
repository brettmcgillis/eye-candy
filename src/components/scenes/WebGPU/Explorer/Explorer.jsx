import React from 'react';

import { CameraRig } from '@modules/cameraRig';

import Caverns from './components/Caverns';
import ChaseCamera from './components/ChaseCamera';
import Smoke from './components/Smoke';
import Sphere from './components/Sphere';
import useAgent from './hooks/useAgent';
import useSceneControls from './hooks/useSceneControls';

export default function Explorer() {
  const config = useSceneControls();
  const { worldRef } = useAgent(config);

  return (
    <>
      {config.chaseCamera ? (
        <ChaseCamera config={config} worldRef={worldRef} />
      ) : (
        <CameraRig camera={config.camera} />
      )}
      <Caverns config={config} worldRef={worldRef} />
      <Sphere config={config} worldRef={worldRef} />
      <Smoke config={config} worldRef={worldRef} />
    </>
  );
}
