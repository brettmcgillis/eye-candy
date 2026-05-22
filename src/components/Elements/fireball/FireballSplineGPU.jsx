import React from 'react';

import PerlinNoiseSplineGPU from '../perlinNoiseBall/PerlinNoiseSplineGPU';

export default function FireballSplineGPU(props) {
  return <PerlinNoiseSplineGPU {...props} greyscale={false} />;
}
