//
// SmokeBallSpline — greyscale Perlin-noise spline (smoke variant of FireballSpline).
// Reuses the same explosion texture, desaturated through a smoke palette.
//
import React from 'react';

import PerlinNoiseSpline from '../perlinNoiseBall/PerlinNoiseSpline';

export default function SmokeBallSpline({
  smokeLightColor = '#bcbcbc',
  smokeDarkColor = '#262626',
  ...rest
}) {
  return (
    <PerlinNoiseSpline
      {...rest}
      greyscale
      smokeLightColor={smokeLightColor}
      smokeDarkColor={smokeDarkColor}
    />
  );
}
