import React, { memo } from 'react';

import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';
import { PostRig } from '@modules/postRig';

import Structure from './components/Structure';
import useExposure from './hooks/useExposure';
import useSceneControls from './hooks/useSceneControls';

function Brutalist() {
  const config = useSceneControls();

  useExposure(config.exposure);
  useSceneBackdrop({ color: config.fogColor });

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />
      <Structure config={config} />
      <PostRig post={config.post} values={config} />
    </>
  );
}

export default memo(Brutalist);
