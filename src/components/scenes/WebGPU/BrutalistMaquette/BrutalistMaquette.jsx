import React, { memo } from 'react';

import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';
import { PostRig } from '@modules/postRig';

import Structure from './components/Structure';
import useSceneControls from './hooks/useSceneControls';

function BrutalistMaquette() {
  const config = useSceneControls();

  useSceneBackdrop({ color: config.studioBackground });

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />
      <Structure config={config} />
      <PostRig post={config.post} values={config} />
    </>
  );
}

export default memo(BrutalistMaquette);
