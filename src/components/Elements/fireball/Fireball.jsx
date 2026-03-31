//
// Fireball — fire-coloured Perlin-noise ball.
// Thin wrapper around PerlinNoiseBall with greyscale off.
//
import React from 'react';

import PerlinNoiseBall from '../perlinNoiseBall/PerlinNoiseBall';

export default function Fireball(props) {
  return <PerlinNoiseBall {...props} greyscale={false} />;
}
