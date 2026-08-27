import React from 'react';

import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import Clouds from './components/Clouds';
import Grass from './components/Grass';
import Herd from './components/Herd';
import SkyDome from './components/SkyDome';
import Terrain from './components/Terrain';
import useDayNight from './hooks/useDayNight';
import useFieldScroll from './hooks/useFieldScroll';
import useSceneControls from './hooks/useSceneControls';

export default function WildHorses() {
  const config = useSceneControls();

  const { herd, scrollUniform, travelUniform } = useFieldScroll({
    herdCount: config.herdCount,
    herdSeed: config.herdSeed,
    herdSpread: config.herdSpread,
    pushBend: config.pushBend,
    pushRadius: config.pushRadius,
    pushStrength: config.pushStrength,
    shadowRadius: config.shadowRadius,
    shadowStrength: config.shadowStrength,
    speed: config.fieldSpeed,
    terrainExtent: config.terrainExtent,
    terrainNoiseScale: config.terrainNoiseScale,
  });

  const dayNight = useDayNight({
    nightLightIntensity: config.nightLightIntensity,
    nightMode: config.nightMode,
    terrainExtent: config.terrainExtent,
    transitionRate: config.transitionRate,
    waveHeight: config.waveHeight,
    waveLength: config.waveLength,
  });

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />
      <SkyDome config={config} dayNight={dayNight} />
      <Clouds config={config} dayNight={dayNight} />
      <Terrain
        config={config}
        dayNight={dayNight}
        herd={herd}
        travelUniform={travelUniform}
      />
      <Grass
        config={config}
        dayNight={dayNight}
        herd={herd}
        scrollUniform={scrollUniform}
        travelUniform={travelUniform}
      />
      <Herd config={config} dayNight={dayNight} />
    </>
  );
}
