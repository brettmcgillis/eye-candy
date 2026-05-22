import React from 'react';

import { ApproximateVolumeFire } from '../utils/ApproximateAtmospherics';
import useIsWebGPURenderer from '../webgpu/useIsWebGPURenderer';
import VolumetricFire from './VolumetricFire';

export default function VolumetricFireRenderer(props) {
  const isWebGPU = useIsWebGPURenderer();

  if (isWebGPU) {
    return (
      <ApproximateVolumeFire
        {...props}
        coreColor={props.tintColor ?? '#ffe7a3'}
        borderColor="#ff7a1a"
      />
    );
  }

  return <VolumetricFire {...props} />;
}
