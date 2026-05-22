import React from 'react';

import { ApproximateSpline } from '../utils/ApproximateAtmospherics';
import useIsWebGPURenderer from '../webgpu/useIsWebGPURenderer';
import FireballSpline from './FireballSpline';

export default function FireballSplineRenderer(props) {
  const isWebGPU = useIsWebGPURenderer();

  if (isWebGPU) {
    return <ApproximateSpline {...props} />;
  }

  return <FireballSpline {...props} />;
}
