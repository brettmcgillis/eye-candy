/* eslint-disable react/no-array-index-key */
import React, { memo } from 'react';

import DownwardSpotLight from './DownwardSpotLight';

const INDOOR_LIGHT_ANGLE = Math.PI / 2;
const INDOOR_LIGHT_DISTANCE = 8000;
const INDOOR_LIGHT_PENUMBRA = 0.6;
const OUTDOOR_LIGHT_ANGLE = Math.PI / 5;
const OUTDOOR_LIGHT_DISTANCE = 10000;
const OUTDOOR_LIGHT_PENUMBRA = 0.4;
const STORE_FILL_DISTANCE = 5000;

const OutdoorLights = memo(function OutdoorLights({
  ambientColor,
  ambientIntensity,
  indoorLightColor,
  indoorLightIntensity = 0,
  moonColor,
  moonIntensity,
  outdoorLightColor,
  outdoorLightIntensity = 0,
  outdoorLightPositions,
  storeFillColor,
  storeFillIntensity = 0,
  storeFrontFillPosition,
  storeInteriorPosition,
}) {
  return (
    <>
      <ambientLight color={ambientColor} intensity={ambientIntensity} />
      <directionalLight
        color={moonColor}
        intensity={moonIntensity}
        position={[-3, 8, 4]}
      />
      {outdoorLightPositions.map((position, i) => (
        <DownwardSpotLight
          key={i}
          angle={OUTDOOR_LIGHT_ANGLE}
          color={outdoorLightColor}
          decay={0}
          distance={OUTDOOR_LIGHT_DISTANCE}
          intensity={outdoorLightIntensity}
          penumbra={OUTDOOR_LIGHT_PENUMBRA}
          position={position}
        />
      ))}
      <DownwardSpotLight
        angle={INDOOR_LIGHT_ANGLE}
        color={indoorLightColor}
        decay={0}
        distance={INDOOR_LIGHT_DISTANCE}
        intensity={indoorLightIntensity}
        penumbra={INDOOR_LIGHT_PENUMBRA}
        position={storeInteriorPosition}
      />
      {storeFrontFillPosition && (
        <pointLight
          color={storeFillColor}
          decay={0}
          distance={STORE_FILL_DISTANCE}
          intensity={storeFillIntensity}
          position={storeFrontFillPosition}
        />
      )}
    </>
  );
});

export default OutdoorLights;
