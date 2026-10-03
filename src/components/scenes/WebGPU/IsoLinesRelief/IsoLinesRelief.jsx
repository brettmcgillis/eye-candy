import React, { memo } from 'react';

import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';
import { PostRig } from '@modules/postRig';

import Relief from './components/Relief';
import useFlatToneMapping from './hooks/useFlatToneMapping';
import useSceneControls from './hooks/useSceneControls';

function IsoLinesRelief() {
  const config = useSceneControls();

  useFlatToneMapping();
  useSceneBackdrop({ color: config.background });

  return (
    <>
      <CameraRig camera={config.camera} />
      <Relief config={config} />
      <PostRig post={config.post} values={config} />
    </>
  );
}

export default memo(IsoLinesRelief);
