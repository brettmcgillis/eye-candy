import React from 'react';

import { ApproximateBall } from '../utils/ApproximateAtmospherics';
import useIsWebGPURenderer from '../webgpu/useIsWebGPURenderer';
import SmokeBall from './SmokeBall';

export default function SmokeBallRenderer(props) {
  const isWebGPU = useIsWebGPURenderer();

  if (isWebGPU) {
    return <ApproximateBall {...props} greyscale />;
  }

  return <SmokeBall {...props} />;
}
