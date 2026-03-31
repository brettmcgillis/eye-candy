//
// FireballSpline — fire-coloured Perlin-noise spline.
// Thin wrapper around PerlinNoiseSpline with greyscale off.
//
import React from 'react';

import PerlinNoiseSpline from '../perlinNoiseBall/PerlinNoiseSpline';

export default function FireballSpline(props) {
  return <PerlinNoiseSpline {...props} greyscale={false} />;
}
