import React from 'react';

import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import Branches from './components/Branches';
import Flares from './components/Flares';
import Landings from './components/Landings';
import ShaftWall from './components/ShaftWall';
import Steps from './components/Steps';
import VolumetricFog from './components/VolumetricFog';
import useSceneControls from './hooks/useSceneControls';
import useShaft from './hooks/useShaft';

export default function GrandStaircase() {
  const config = useSceneControls();
  const shaft = useShaft(config);

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />
      <ShaftWall config={config} shaft={shaft} />
      <Steps config={config} shaft={shaft} />
      <Landings config={config} shaft={shaft} />
      <Branches config={config} shaft={shaft} />
      <Flares config={config} shaft={shaft} />
      <VolumetricFog config={config} shaft={shaft} />
    </>
  );
}
