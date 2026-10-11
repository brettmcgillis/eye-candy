import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three';

import Moon from '@elements/Moon/Moon';
import { readWaveSettings, useIfftOceanRuntime } from '@modules/ifftOcean';

import { directionFromAngles } from '../../utils/sceneUtils';

const MOON_DISTANCE = 4000;
const DEG2RAD = Math.PI / 180;
const UP = new THREE.Vector3(0, 1, 0);

function buildRuntimeConfig(c, sunAzimuth, sunElevation, oceanColors) {
  return {
    buoyancy: { modeCount: 160 },
    foam: {
      foamStrength: c.oceanFoamStrength,
      foamThreshold: c.oceanFoamThreshold,
    },
    ocean: {
      lodScale: c.oceanLodScale,
      patchResolution: c.oceanPatchResolution,
      patchSize: c.oceanPatchSize,
      wireframe: false,
    },
    oceanColors,
    performance: {
      pauseWater: false,
      quality: c.oceanQuality,
      waveUpdateHz: 30,
    },
    sky: {
      azimuth: sunAzimuth,
      elevation: sunElevation,
      exposure: c.oceanExposure,
      mieCoefficient: c.oceanSkyMie,
      mieDirectionalG: 0.7,
      rayleigh: c.oceanSkyRayleigh,
      turbidity: c.oceanSkyTurbidity,
      up: [0, 1, 0],
      visible: c.oceanSkyVisible,
    },
    waveSettings: readWaveSettings(c, 'oceanFirst_', 'oceanSecond_'),
  };
}

function OceanLocation({ anchorRef, config, sunAzimuth, sunElevation }) {
  const oceanColors = useMemo(
    () =>
      config.oceanCustomColors
        ? {
            fadeColor: config.oceanFadeColor,
            foamColor: config.oceanFoamColor,
            horizonColor: config.oceanHorizonColor,
            seaColor: config.oceanSeaColor,
            skyColor: config.oceanReflectColor,
            specularColor: config.oceanSpecularColor,
            specularStrength: config.oceanSpecularStrength,
            sunColor: config.oceanSpecularColor,
            waveColor: config.oceanWaveColor,
          }
        : undefined,
    [
      config.oceanCustomColors,
      config.oceanFadeColor,
      config.oceanFoamColor,
      config.oceanHorizonColor,
      config.oceanReflectColor,
      config.oceanSeaColor,
      config.oceanSpecularColor,
      config.oceanSpecularStrength,
      config.oceanWaveColor,
    ]
  );

  const runtimeConfig = buildRuntimeConfig(
    config,
    sunAzimuth,
    sunElevation,
    oceanColors
  );
  const { sampler } = useIfftOceanRuntime(runtimeConfig);

  const scratch = useMemo(() => new THREE.Vector3(), []);
  const normal = useMemo(() => new THREE.Vector3(), []);
  const tilt = useMemo(() => new THREE.Quaternion(), []);
  const heightRef = useRef(0);

  useEffect(() => {
    const anchor = anchorRef.current;
    return () => {
      anchor.position.set(0, 0, 0);
      anchor.quaternion.identity();
    };
  }, [anchorRef]);

  useFrame((_, delta) => {
    const anchor = anchorRef.current;
    if (!sampler || !anchor) return;
    const ride = config.oceanGhostRide;
    const height = sampler.sampleSurfaceHeight(0, 0, scratch) * ride;
    const follow = 1 - Math.exp(-delta * config.oceanGhostFollow);
    heightRef.current += (height - heightRef.current) * follow;
    anchor.position.set(0, heightRef.current, 0);

    sampler.sampleNormal(0, 0, normal, 1.2);
    normal.lerp(UP, 1 - ride * config.oceanGhostRock).normalize();
    tilt.setFromUnitVectors(UP, normal);
    anchor.quaternion.slerp(tilt, follow);
  });

  const moonPosition = useMemo(
    () =>
      directionFromAngles(sunAzimuth, sunElevation).multiplyScalar(
        MOON_DISTANCE
      ),
    [sunAzimuth, sunElevation]
  );
  const moonRadius =
    MOON_DISTANCE * Math.tan((config.oceanMoonSize * DEG2RAD) / 2);

  if (!config.oceanMoonVisible) return null;

  return (
    <Moon
      emissive={config.oceanMoonColor}
      emissiveIntensity={config.oceanMoonGlow}
      emissiveUsesTexture
      fog={false}
      position={moonPosition}
      radius={moonRadius}
      segments={48}
    />
  );
}

export default memo(OceanLocation);
