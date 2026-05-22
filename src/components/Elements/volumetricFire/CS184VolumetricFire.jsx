import React from 'react';

import { useThree } from '@react-three/fiber';

import CS184VolumetricFireGL from './CS184VolumetricFireGL';
import CS184VolumetricFireGPU from './CS184VolumetricFireGPU';

export default function CS184VolumetricFire(props) {
  const gl = useThree((state) => state.gl);
  const isWebGPU = gl?.isWebGPURenderer === true;

  if (isWebGPU) {
    return <CS184VolumetricFireGPU {...props} />;
  }

  return <CS184VolumetricFireGL {...props} />;
}