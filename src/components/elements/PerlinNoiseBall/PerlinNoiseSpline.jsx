import React from 'react';

import { useThree } from '@react-three/fiber';

import PerlinNoiseSplineGL from './PerlinNoiseSplineGL';
import PerlinNoiseSplineGPU from './PerlinNoiseSplineGPU';

export default function PerlinNoiseSpline(props) {
  const gl = useThree((state) => state.gl);
  const isWebGPU = gl?.isWebGPURenderer === true;

  if (isWebGPU) {
    return <PerlinNoiseSplineGPU {...props} />;
  }

  return <PerlinNoiseSplineGL {...props} />;
}
