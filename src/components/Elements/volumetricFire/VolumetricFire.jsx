import React from 'react';

import { useThree } from '@react-three/fiber';

import VolumetricFireGL from './VolumetricFireGL';
import VolumetricFireGPU from './VolumetricFireGPU';

export default function VolumetricFire(props) {
  const gl = useThree((state) => state.gl);
  const isWebGPU = gl?.isWebGPURenderer === true;

  if (isWebGPU) {
    return <VolumetricFireGPU {...props} />;
  }

  return <VolumetricFireGL {...props} />;
}