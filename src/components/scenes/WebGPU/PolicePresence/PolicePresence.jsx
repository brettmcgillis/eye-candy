import React, { memo } from 'react';

import useRenderScale from '@hooks/useRenderScale';
import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import CharredCruiser from './components/CharredCruiser';
import Cinderblocks from './components/Cinderblocks';
import CruiserLights from './components/CruiserLights';
import Embers from './components/Embers';
import FireLights from './components/FireLights';
import Ground from './components/Ground';
import PostStack from './components/PostStack';
import useFireVolume from './hooks/useFireVolume';
import useSceneControls from './hooks/useSceneControls';

function PolicePresence() {
  const config = useSceneControls();
  useRenderScale(config.renderScale);
  // Fog fades the floor's far edge into the paper. The hook never clears a
  // fog once set, so "off" pushes it out of reach instead.
  useSceneBackdrop({
    color: config.backgroundColor,
    fogFar: config.fogEnabled ? config.fogFar : 1e6,
    fogNear: config.fogEnabled ? config.fogNear : 1e6,
  });
  const volume = useFireVolume(config);
  const burning = config.plumeVisible && volume.lit;

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />

      <CharredCruiser config={config} />
      {config.showCinderblocks ? <Cinderblocks config={config} /> : null}
      {config.floorVisible ? <Ground config={config} /> : null}
      <CruiserLights config={config} />
      {burning ? <FireLights config={config} /> : null}
      {burning && config.emberVisible ? <Embers config={config} /> : null}

      <PostStack
        bloom={{
          enabled: config.bloomEnabled,
          radius: config.bloomRadius,
          strength: config.bloomStrength,
          threshold: config.bloomThreshold,
        }}
        volume={config.plumeVisible ? volume : null}
      />
    </>
  );
}

export default memo(PolicePresence);
