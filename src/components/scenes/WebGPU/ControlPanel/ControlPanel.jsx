import React, { memo } from 'react';

import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';
import { PostRig } from '@modules/postRig';

import Panel from './components/Panel';
import useSceneControls from './hooks/useSceneControls';

function ControlPanel() {
  const config = useSceneControls();

  useSceneBackdrop({ color: config.background });

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />
      <Panel config={config} />
      <PostRig post={config.post} values={config} />
    </>
  );
}

export default memo(ControlPanel);
