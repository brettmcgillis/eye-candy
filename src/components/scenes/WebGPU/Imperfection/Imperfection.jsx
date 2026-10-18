import React, { memo } from 'react';

import { CameraRig } from '@modules/cameraRig';

import Painting from './components/Painting';
import useFlatToneMapping from './hooks/useFlatToneMapping';
import useSceneControls from './hooks/useSceneControls';

function Imperfection() {
  const config = useSceneControls();

  useFlatToneMapping();

  return (
    <>
      <CameraRig apiRef={config.cameraApiRef} camera={config.camera} />
      <Painting config={config} />
    </>
  );
}

export default memo(Imperfection);
