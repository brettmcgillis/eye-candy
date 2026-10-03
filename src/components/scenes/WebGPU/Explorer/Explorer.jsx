import React from 'react';

import { CameraRig } from '@modules/cameraRig';

import Caverns from './components/Caverns';
import ChaseCamera from './components/ChaseCamera';
import useAgent from './hooks/useAgent';
import useSceneControls from './hooks/useSceneControls';

export default function Explorer() {
  const config = useSceneControls();
  const { agent, worldRef } = useAgent(config);

  return (
    <>
      {config.chaseCamera ? (
        <ChaseCamera agent={agent} config={config} worldRef={worldRef} />
      ) : (
        <CameraRig camera={config.camera} />
      )}
      <Caverns config={config} worldRef={worldRef} />
    </>
  );
}
