import React, { memo } from 'react';

import { CameraRig } from '@modules/cameraRig';
import { CandleStage } from '@modules/candleRender';

import useSceneControls from './hooks/useSceneControls';

function BurningAtBothEnds() {
  const config = useSceneControls();

  return (
    <>
      <CameraRig autoRotate={config.autoRotate} camera={config.camera} />
      <CandleStage config={config} />
    </>
  );
}

export default memo(BurningAtBothEnds);
