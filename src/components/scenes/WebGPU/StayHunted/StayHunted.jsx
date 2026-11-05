import React from 'react';

import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';
import { HuntedSubject, useNeutralToneMapping } from '@modules/rabbitRender';

import useSceneControls from './hooks/useSceneControls';

export default function StayHunted() {
  const config = useSceneControls();
  useSceneBackdrop({ color: config.paperColor });
  useNeutralToneMapping();

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />
      <HuntedSubject config={config} />
    </>
  );
}
