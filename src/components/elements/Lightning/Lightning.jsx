import React from 'react';

import { useThree } from '@react-three/fiber';

import LightningGL from './LightningGL';
import LightningGPU from './LightningGPU';

export default function Lightning(props) {
  const gl = useThree((state) => state.gl);

  if (gl?.isWebGPURenderer === true) {
    return <LightningGPU {...props} />;
  }

  return <LightningGL {...props} />;
}
