import React from 'react';

import { CameraRig } from '@modules/cameraRig';

import FractalField from './components/FractalField';
import useSceneControls from './hooks/useSceneControls';

export default function Apollian() {
  const config = useSceneControls();

  return (
    <>
      <CameraRig camera={config.camera} />
      <FractalField config={config} />
    </>
  );
}
