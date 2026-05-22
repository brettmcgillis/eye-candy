import React from 'react';

import { ApproximateGridBox } from '../utils/ApproximateAtmospherics';
import useIsWebGPURenderer from '../webgpu/useIsWebGPURenderer';
import GridBox from './GridBox';

export default function GridBoxRenderer(props) {
  const isWebGPU = useIsWebGPURenderer();

  if (isWebGPU) {
    return <ApproximateGridBox {...props} />;
  }

  return <GridBox {...props} />;
}
