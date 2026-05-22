import React from 'react';

import { useThree } from '@react-three/fiber';

import FireballSplineGL from './FireballSplineGL';
import FireballSplineGPU from './FireballSplineGPU';

export default function FireballSpline(props) {
  const gl = useThree((state) => state.gl);
  const isWebGPU = gl?.isWebGPURenderer === true;

  if (isWebGPU) {
    return <FireballSplineGPU {...props} />;
  }

  return <FireballSplineGL {...props} />;
}
