import React from 'react';

import PerlinNoiseBallGPU from '../perlinNoiseBall/PerlinNoiseBallGPU';

export default function SmokeBallGPU({
  smokeLightColor = '#bcbcbc',
  smokeDarkColor = '#262626',
  ...rest
}) {
  return (
    <PerlinNoiseBallGPU
      {...rest}
      greyscale
      smokeLightColor={smokeLightColor}
      smokeDarkColor={smokeDarkColor}
    />
  );
}
