//
// SmokeBall — greyscale Perlin-noise ball (smoke variant of Fireball).
// Reuses the same explosion texture, desaturated through a smoke palette.
//
import React from 'react';

import PerlinNoiseBall from '../perlinNoiseBall/PerlinNoiseBall';

export default function SmokeBall({
  smokeLightColor = '#bcbcbc',
  smokeDarkColor = '#262626',
  ...rest
}) {
  return (
    <PerlinNoiseBall
      {...rest}
      greyscale
      smokeLightColor={smokeLightColor}
      smokeDarkColor={smokeDarkColor}
    />
  );
}
