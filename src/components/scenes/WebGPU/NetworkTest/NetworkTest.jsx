import React, { memo } from 'react';

import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';
import { PostRig } from '@modules/postRig';

import Network from './components/Network';
import useFlatToneMapping from './hooks/useFlatToneMapping';
import useSceneControls from './hooks/useSceneControls';

function NetworkTest() {
  const config = useSceneControls();

  useFlatToneMapping();
  useSceneBackdrop({ color: config.background });

  return (
    <>
      <CameraRig camera={config.camera} />
      <Network config={config} />
      <PostRig post={config.post} values={config} />
    </>
  );
}

export default memo(NetworkTest);
