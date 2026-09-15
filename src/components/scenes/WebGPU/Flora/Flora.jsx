import React, { memo } from 'react';

import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import Specimen from './components/Specimen';
import useSceneControls from './hooks/useSceneControls';

function Flora() {
  const config = useSceneControls();

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />
      <color attach="background" args={[config.backgroundColor]} />
      <Specimen config={config} lifecycleApiRef={config.lifecycleApiRef} />
    </>
  );
}

export default memo(Flora);
