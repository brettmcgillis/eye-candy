import React from 'react';

import { ApproximateVolumeFire } from '../utils/ApproximateAtmospherics';
import useIsWebGPURenderer from '../webgpu/useIsWebGPURenderer';
import CS184VolumetricFire from './CS184VolumetricFire';

export default function CS184VolumetricFireRenderer(props) {
  const isWebGPU = useIsWebGPURenderer();

  if (isWebGPU) {
    return <ApproximateVolumeFire {...props} />;
  }

  return <CS184VolumetricFire {...props} />;
}
