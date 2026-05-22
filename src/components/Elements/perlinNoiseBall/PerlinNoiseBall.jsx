import React from 'react';

import { useThree } from '@react-three/fiber';

import PerlinNoiseBallGL from './PerlinNoiseBallGL';
import PerlinNoiseBallGPU from './PerlinNoiseBallGPU';

export default function PerlinNoiseBall(props) {
  const gl = useThree((state) => state.gl);
  const isWebGPU = gl?.isWebGPURenderer === true;

  if (isWebGPU) {
    return <PerlinNoiseBallGPU {...props} />;
  }

  return <PerlinNoiseBallGL {...props} />;
}
