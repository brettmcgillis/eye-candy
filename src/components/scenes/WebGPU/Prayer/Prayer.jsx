import React, { useEffect, useRef } from 'react';

import { useThree } from '@react-three/fiber';

import { Color } from 'three';

import { CameraRig } from '@modules/cameraRig';
import Godrays from '@postprocessing/WebGPU/godrays/Godrays';

import PrayerCluster from './components/PrayerCluster';
import SceneLighting from './components/SceneLighting';
import useSceneControls from './hooks/useSceneControls';

function SceneBackground({ color }) {
  const { scene } = useThree();

  useEffect(() => {
    scene.background = new Color(color);
  }, [color, scene]);

  return null;
}

export default function Prayer() {
  const godraysLightRef = useRef(null);
  const config = useSceneControls();

  return (
    <>
      <CameraRig camera={config.camera} />
      <SceneBackground color={config.bgColor} />

      <SceneLighting
        ambientColor={config.ambientColor}
        ambientIntensity={config.ambientIntensity}
        keyColor={config.keyColor}
        keyIntensity={config.keyIntensity}
        keyPosition={config.keyPosition}
        fillColor={config.fillColor}
        fillIntensity={config.fillIntensity}
        fillPosition={config.fillPosition}
        godraysColor={config.godraysColor}
        godraysIntensity={config.godraysIntensity}
        godraysPosition={config.godraysPosition}
        godraysLightRef={godraysLightRef}
      />

      <PrayerCluster config={config} />

      {config.godraysEnabled && (
        <Godrays
          lightRef={godraysLightRef}
          blendColor={config.godraysBlendColor}
          density={config.godraysDensity}
          maxDensity={config.godraysMaxDensity}
          distanceAttenuation={config.godraysDistanceAttenuation}
          blur={config.godraysBlur}
          edgeRadius={config.godraysEdgeRadius}
          edgeStrength={config.godraysEdgeStrength}
          bloomStrength={config.bloomEnabled ? config.bloomStrength : 0}
          bloomThreshold={config.bloomThreshold}
          bloomRadius={config.bloomRadius}
        />
      )}
    </>
  );
}
