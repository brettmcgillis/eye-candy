import React from 'react';

import PerlinNoiseBallGPU from '../perlinNoiseBall/PerlinNoiseBallGPU';

export default function FireballGPU(props) {
  return <PerlinNoiseBallGPU {...props} greyscale={false} />;
}
