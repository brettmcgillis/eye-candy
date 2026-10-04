import React, { memo } from 'react';

import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import Tubes from './components/Tubes';
import useSceneControls from './hooks/useSceneControls';

function Trucheterie3D() {
  const config = useSceneControls();

  useSceneBackdrop({ color: config.sceneBgColor });

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />
      <Tubes config={config} />
    </>
  );
}

export default memo(Trucheterie3D);
