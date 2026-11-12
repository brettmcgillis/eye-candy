import React, { memo, useRef } from 'react';

import Boeing737 from '@elements/Boeing737/Boeing737';
import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import CloudSky from './components/CloudSky';
import FireLights from './components/FireLights';
import SkyGrade from './components/SkyGrade';
import Sparks from './components/Sparks';
import useDayCycle from './hooks/useDayCycle';
import useFlatToneMapping from './hooks/useFlatToneMapping';
import usePlumeVolume from './hooks/usePlumeVolume';
import useSceneControls from './hooks/useSceneControls';
import { gradeFrom } from './utils/dayCycle';

const DEG = Math.PI / 180;

function FlyingHigh() {
  const config = useSceneControls();
  useFlatToneMapping();
  const plane = useRef(null);
  const { cycle, onLightChange } = useDayCycle(config);
  const volume = usePlumeVolume(config, plane, cycle);

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} onLightChange={onLightChange} />
      <CloudSky config={config} cycle={cycle} />

      <group
        ref={plane}
        position={[config.planePosX, config.planePosY, config.planePosZ]}
        rotation={[
          config.planeRotXDeg * DEG,
          config.planeRotYDeg * DEG,
          config.planeRotZDeg * DEG,
        ]}
        scale={config.planeScale}
      >
        <Boeing737 />
        {config.plumeVisible ? <FireLights config={config} /> : null}
        {config.plumeVisible && config.emberVisible ? (
          <Sparks config={config} />
        ) : null}
      </group>

      <SkyGrade
        bloom={{
          enabled: config.bloomEnabled,
          radius: config.bloomRadius,
          strength: config.bloomStrength,
          threshold: config.bloomThreshold,
        }}
        volume={config.plumeVisible ? volume : null}
        cycle={cycle}
        flare={{
          chroma: config.flareChroma,
          enabled: config.flareEnabled,
          intensity: config.flareIntensity,
          moon: config.flareMoon,
          size: config.flareSize,
        }}
        grade={gradeFrom(config)}
      />
    </>
  );
}

export default memo(FlyingHigh);
