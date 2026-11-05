import React, { memo, useMemo } from 'react';

import PoliceCruiser from '@elements/PoliceCruiser/PoliceCruiser';
import SplineSimFire from '@elements/SimFire/SplineSimFire';
import { fireConfig } from '@elements/SimFire/simFireControls';
import useRenderScale from '@hooks/useRenderScale';
import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';
import Bloom from '@postprocessing/WebGPU/bloom/Bloom';

import Cinderblocks from './components/Cinderblocks';
import CruiserLights from './components/CruiserLights';
import Ground from './components/Ground';
import SmokePlume from './components/SmokePlume';
import useSceneControls from './hooks/useSceneControls';
import { FIRE_SPLINES, litSplines } from './utils/fire';

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

  const lit = FIRE_SPLINES.map(({ key }) => config[key]).join();
  const fireSplines = useMemo(() => litSplines(config), [lit]);
  const fire = {
    ...fireConfig(config),
    cutoff: config.fireCutoff,
    flameOpacity: config.fireFlameOpacity,
    skipBelow: config.fireSkipBelow,
    sootColor: config.fireSootColor,
    stepLength: config.fireStepLength,
  };

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />

      <PoliceCruiser showTires={config.showTires} />
      {config.showCinderblocks ? <Cinderblocks config={config} /> : null}
      {config.floorVisible ? (
        <Ground
          color={config.floorColor}
          roughness={config.floorRoughness}
          size={config.floorSize}
        />
      ) : null}
      <CruiserLights config={config} />

      {config.fireVisible && fireSplines.length ? (
        <SplineSimFire fire={fire} splines={fireSplines} />
      ) : null}
      {config.plumeVisible ? <SmokePlume config={config} /> : null}

      {config.bloomEnabled ? (
        <Bloom
          radius={config.bloomRadius}
          strength={config.bloomStrength}
          threshold={config.bloomThreshold}
        />
      ) : null}
    </>
  );
}

export default memo(PolicePresence);
