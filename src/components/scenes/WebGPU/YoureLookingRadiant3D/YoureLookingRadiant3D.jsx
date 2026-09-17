import React from 'react';

import { CameraRig } from '@modules/cameraRig';

import RadiantVolume from './components/RadiantVolume';
import useSceneControls from './hooks/useSceneControls';

export default function YoureLookingRadiant3D() {
  const config = useSceneControls();

  return (
    <>
      <CameraRig camera={config.camera} />
      <RadiantVolume config={config} />
    </>
  );
}
