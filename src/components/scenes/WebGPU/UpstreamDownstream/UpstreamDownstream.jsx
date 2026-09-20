import React, { memo } from 'react';

import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import StreamField from './components/StreamField';
import useSceneControls from './hooks/useSceneControls';

function UpstreamDownstream() {
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
      <StreamField config={config} />
    </>
  );
}

export default memo(UpstreamDownstream);
