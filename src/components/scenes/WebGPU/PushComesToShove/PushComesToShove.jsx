import React, { memo } from 'react';

import useRenderScale from '@hooks/useRenderScale';
import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import Shove from './components/Shove';
import useSceneControls from './hooks/useSceneControls';

function PushComesToShove() {
  const config = useSceneControls();
  useSceneBackdrop({ color: config.backgroundColor });
  useRenderScale(config.renderScale);

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />
      <Shove config={config} />
    </>
  );
}

export default memo(PushComesToShove);
