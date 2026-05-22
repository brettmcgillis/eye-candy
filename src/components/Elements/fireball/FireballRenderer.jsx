import React from 'react';

import { ApproximateBall } from '../utils/ApproximateAtmospherics';
import useIsWebGPURenderer from '../webgpu/useIsWebGPURenderer';
import Fireball from './Fireball';

export default function FireballRenderer(props) {
  const isWebGPU = useIsWebGPURenderer();

  if (isWebGPU) {
    return <ApproximateBall {...props} />;
  }

  return <Fireball {...props} />;
}
