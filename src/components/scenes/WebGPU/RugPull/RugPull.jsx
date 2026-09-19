import React from 'react';

import { CameraRig } from '@modules/cameraRig';

import RugRoom from './components/RugRoom';
import useSceneControls from './hooks/useSceneControls';

export default function RugPull() {
  const config = useSceneControls();

  return (
    <>
      <color args={[config.floorColor]} attach="background" />
      <CameraRig camera={config.camera} />
      <RugRoom config={config} />
    </>
  );
}
