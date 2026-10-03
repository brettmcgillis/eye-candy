import React, { memo } from 'react';

import { CameraRig } from '@modules/cameraRig';
import { PostRig } from '@modules/postRig';

import Stage from './components/Stage';
import useFlatToneMapping from './hooks/useFlatToneMapping';
import useSceneControls from './hooks/useSceneControls';

function Apollian() {
  const config = useSceneControls();

  useFlatToneMapping();

  const turning =
    config.motionMode === 'turntable' && config.sceneView === 'object';

  return (
    <>
      <CameraRig
        apiRef={config.cameraApiRef}
        autoRotate={turning}
        autoRotateSpeed={(60 / config.turntableSeconds) * config.motionSpeed}
        camera={config.camera}
      />
      <Stage config={config} />
      <PostRig post={config.post} values={config} />
    </>
  );
}

export default memo(Apollian);
