import React from 'react';

import { useThree } from '@react-three/fiber';

import SmokeBallSplineGL from './SmokeBallSplineGL';
import SmokeBallSplineGPU from './SmokeBallSplineGPU';

export default function SmokeBallSpline(props) {
  const gl = useThree((state) => state.gl);
  const isWebGPU = gl?.isWebGPURenderer === true;

  if (isWebGPU) {
    return <SmokeBallSplineGPU {...props} />;
  }

  return <SmokeBallSplineGL {...props} />;
}
