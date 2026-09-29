import React, { memo } from 'react';

import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import Panel from './components/Panel';
import useSceneControls from './hooks/useSceneControls';

function Kumiko() {
  const config = useSceneControls();

  useSceneBackdrop({ color: config.backgroundColor });

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />
      <Panel config={config} />
    </>
  );
}

export default memo(Kumiko);
