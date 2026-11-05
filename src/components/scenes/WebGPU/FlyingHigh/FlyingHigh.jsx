import React, { memo } from 'react';

import Boeing737 from '@elements/Boeing737/Boeing737';
import Moon from '@elements/Moon/Moon';
import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';
import Bloom from '@postprocessing/WebGPU/bloom/Bloom';

import EnginePlumes from './components/EnginePlumes';
import PaintedClouds from './components/PaintedClouds';
import PaperBackdrop from './components/PaperBackdrop';
import SkyPanel from './components/SkyPanel';
import useFlatToneMapping from './hooks/useFlatToneMapping';
import useSceneControls from './hooks/useSceneControls';

const DEG = Math.PI / 180;

function FlyingHigh() {
  const config = useSceneControls();
  useSceneBackdrop({ color: config.background });
  useFlatToneMapping();

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />
      <PaperBackdrop
        color={config.background}
        grain={config.paperGrain}
        warmth={config.paperWarmth}
      />

      <SkyPanel
        sky={{
          bleedAmount: config.skyBleedAmount,
          brushStrength: config.skyBrushStrength,
          color: config.skyColor,
          edgeDarkening: config.skyEdgeDarkening,
          edgeSoftness: config.skyEdgeSoftness,
          grainAmount: config.skyGrainAmount,
          height: config.skyHeight,
          poolingStrength: config.skyPoolingStrength,
          position: [config.skyPosX, config.skyPosY, config.skyPosZ],
          strength: config.skyStrength,
          warpStrength: config.skyWarpStrength,
          width: config.skyWidth,
        }}
      />
      {config.moonVisible ? (
        <Moon
          color={config.moonColor}
          emissive={config.moonEmissive}
          emissiveIntensity={config.moonEmissiveIntensity}
          metalness={config.moonMetalness}
          position={[config.moonPosX, config.moonPosY, config.moonPosZ]}
          roughness={config.moonRoughness}
          scale={config.moonScale}
        />
      ) : null}
      <PaintedClouds config={config} />

      <group
        position={[config.planePosX, config.planePosY, config.planePosZ]}
        rotation={[
          config.planeRotXDeg * DEG,
          config.planeRotYDeg * DEG,
          config.planeRotZDeg * DEG,
        ]}
        scale={config.planeScale}
      >
        <Boeing737 />
        {config.plumeVisible ? <EnginePlumes config={config} /> : null}
      </group>

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

export default memo(FlyingHigh);
