import React from 'react';

import PerlinNoiseSplineGPU from '../perlinNoiseBall/PerlinNoiseSplineGPU';

export default function SmokeBallSplineGPU({
  smokeLightColor = '#bcbcbc',
  smokeDarkColor = '#262626',
  ...rest
}) {
  return (
    <PerlinNoiseSplineGPU
      {...rest}
      greyscale
      smokeLightColor={smokeLightColor}
      smokeDarkColor={smokeDarkColor}
    />
  );
}
