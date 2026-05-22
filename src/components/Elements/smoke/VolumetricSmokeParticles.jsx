import React from 'react';

import { useThree } from '@react-three/fiber';

import VolumetricSmokeParticlesGL from './VolumetricSmokeParticlesGL';
import VolumetricSmokeParticlesGPU from './VolumetricSmokeParticlesGPU';

export default function VolumetricSmokeParticles(props) {
  const gl = useThree((state) => state.gl);
  const isWebGPU = gl?.isWebGPURenderer === true;

  if (isWebGPU) {
    return <VolumetricSmokeParticlesGPU {...props} />;
  }

  return <VolumetricSmokeParticlesGL {...props} />;
}
