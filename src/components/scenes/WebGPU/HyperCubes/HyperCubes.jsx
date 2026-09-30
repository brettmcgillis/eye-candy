import React, { memo } from 'react';

import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';
import { PostRig } from '@modules/postRig';

import Cubes from './components/Cubes';
import useFlatToneMapping from './hooks/useFlatToneMapping';
import useSceneControls from './hooks/useSceneControls';

function HyperCubes() {
  const config = useSceneControls();

  useFlatToneMapping();
  useSceneBackdrop({ color: config.background });

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />
      <Cubes config={config} />
      <PostRig post={config.post} values={config} />
    </>
  );
}

export default memo(HyperCubes);
