import React from 'react';

import { ApproximateFlame } from '../utils/ApproximateAtmospherics';
import useIsWebGPURenderer from '../webgpu/useIsWebGPURenderer';
import Flame from './Flame';

export default function FlameRenderer(props) {
  const isWebGPU = useIsWebGPURenderer();

  if (isWebGPU) {
    return <ApproximateFlame {...props} />;
  }

  return <Flame {...props} />;
}
