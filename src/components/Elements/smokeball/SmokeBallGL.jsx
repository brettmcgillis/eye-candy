import React from 'react';

import PerlinNoiseBallGL from '../perlinNoiseBall/PerlinNoiseBallGL';

export default function SmokeBallGL({
  smokeLightColor = '#bcbcbc',
  smokeDarkColor = '#262626',
  ...rest
}) {
  return (
    <PerlinNoiseBallGL
      {...rest}
      greyscale
      smokeLightColor={smokeLightColor}
      smokeDarkColor={smokeDarkColor}
    />
  );
}
