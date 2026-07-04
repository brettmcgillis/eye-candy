import React, { memo, useMemo } from 'react';

import { WORLD_SIZE } from '../utils/heightField';

// Sunny-afternoon lighting: a warm directional sun (with shadows so the
// carved walls shade the water), hemisphere sky fill, and a sky background.
function SkyRig({ config }) {
  const sunPosition = useMemo(() => {
    const azimuth = (config.sunAzimuth * Math.PI) / 180;
    const elevation = (config.sunElevation * Math.PI) / 180;
    const distance = 30;
    return [
      Math.sin(azimuth) * Math.cos(elevation) * distance,
      Math.sin(elevation) * distance,
      Math.cos(azimuth) * Math.cos(elevation) * distance,
    ];
  }, [config.sunAzimuth, config.sunElevation]);

  const shadowExtent = WORLD_SIZE * 0.62;

  return (
    <>
      <color args={[config.bgColor]} attach="background" />
      <hemisphereLight
        args={[config.skyColor, config.groundColor, config.hemiIntensity]}
      />
      <directionalLight
        castShadow
        color={config.sunColor}
        intensity={config.sunIntensity}
        position={sunPosition}
        shadow-bias={-0.0004}
        shadow-camera-bottom={-shadowExtent}
        shadow-camera-far={80}
        shadow-camera-left={-shadowExtent}
        shadow-camera-near={1}
        shadow-camera-right={shadowExtent}
        shadow-camera-top={shadowExtent}
        shadow-mapSize={[2048, 2048]}
        shadow-normalBias={0.03}
      />
    </>
  );
}

export default memo(SkyRig);
