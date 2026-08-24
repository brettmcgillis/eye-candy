import React from 'react';

import PerlinNoiseSplineGL from '../perlinNoiseBall/PerlinNoiseSplineGL';

export default function SmokeBallSplineGL({
  smokeLightColor = '#bcbcbc',
  smokeDarkColor = '#262626',
  ...rest
}) {
  return (
    <PerlinNoiseSplineGL
      {...rest}
      greyscale
      smokeLightColor={smokeLightColor}
      smokeDarkColor={smokeDarkColor}
    />
  );
}
