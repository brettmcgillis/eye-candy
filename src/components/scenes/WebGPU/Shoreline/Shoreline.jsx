import React, { memo } from 'react';

import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import GrainField from './components/GrainField';
import useSceneControls from './hooks/useSceneControls';

function Shoreline() {
  const config = useSceneControls();

  useSceneBackdrop({
    color: config.backgroundColor,
    fogFar: config.fogFar,
    fogNear: config.fogNear,
  });

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />
      <GrainField config={config} />
    </>
  );
}

export default memo(Shoreline);
