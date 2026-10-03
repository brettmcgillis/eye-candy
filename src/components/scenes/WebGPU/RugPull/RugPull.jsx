import React, { memo } from 'react';

import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';

import Rug from './components/Rug';
import useSceneControls from './hooks/useSceneControls';

function RugPull() {
  const config = useSceneControls();

  useSceneBackdrop({ color: '#17120f' });

  return (
    <>
      <CameraRig camera={config.camera} />
      <Rug config={config} />
    </>
  );
}

export default memo(RugPull);
