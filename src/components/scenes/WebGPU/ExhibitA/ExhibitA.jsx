import React, { memo } from 'react';

import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';
import { PostRig } from '@modules/postRig';

import Exhibit from './components/Exhibit';
import useFlatToneMapping from './hooks/useFlatToneMapping';
import useSceneControls from './hooks/useSceneControls';

function ExhibitA() {
  const config = useSceneControls();

  useFlatToneMapping();
  useSceneBackdrop({ color: config.background });

  return (
    <>
      <CameraRig
        apiRef={config.cameraApiRef}
        autoRotate={config.motionMode === 'turntable'}
        autoRotateSpeed={(60 / config.turntableSeconds) * config.motionSpeed}
        camera={config.camera}
      />
      <Exhibit config={config} />
      <PostRig post={config.post} values={config} />
    </>
  );
}

export default memo(ExhibitA);
