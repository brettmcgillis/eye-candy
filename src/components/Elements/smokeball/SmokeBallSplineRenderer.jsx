import React from 'react';

import { ApproximateSpline } from '../utils/ApproximateAtmospherics';
import useIsWebGPURenderer from '../webgpu/useIsWebGPURenderer';
import SmokeBallSpline from './SmokeBallSpline';

export default function SmokeBallSplineRenderer(props) {
  const isWebGPU = useIsWebGPURenderer();

  if (isWebGPU) {
    return <ApproximateSpline {...props} greyscale />;
  }

  return <SmokeBallSpline {...props} />;
}
