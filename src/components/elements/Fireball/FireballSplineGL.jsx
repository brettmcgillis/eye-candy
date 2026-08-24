import React from 'react';

import PerlinNoiseSplineGL from '../perlinNoiseBall/PerlinNoiseSplineGL';

export default function FireballSplineGL(props) {
  return <PerlinNoiseSplineGL {...props} greyscale={false} />;
}
