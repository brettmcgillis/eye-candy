import React from 'react';

import { ApproximateSmokeColumn } from '../utils/ApproximateAtmospherics';
import useIsWebGPURenderer from '../webgpu/useIsWebGPURenderer';
import Smoke2D from './Smoke2D';

export default function Smoke2DRenderer(props) {
  const isWebGPU = useIsWebGPURenderer();

  if (isWebGPU) {
    return <ApproximateSmokeColumn {...props} />;
  }

  return <Smoke2D {...props} />;
}
