import React, { memo } from 'react';

import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import Pattern from './components/Pattern';
import useSceneControls from './hooks/useSceneControls';
import useToneMapping from './hooks/useToneMapping';

function Argyle() {
  const config = useSceneControls();
  useToneMapping();
  useSceneBackdrop({ color: config.background });
  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />
      <Pattern config={config} />
    </>
  );
}
export default memo(Argyle);
