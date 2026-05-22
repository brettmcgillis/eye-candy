import React from 'react';

import { useThree } from '@react-three/fiber';

import SmokeParticlesGL from './SmokeParticlesGL';
import SmokeParticlesGPU from './SmokeParticlesGPU';

export default function SmokeParticles(props) {
  const gl = useThree((state) => state.gl);
  const isWebGPU = gl?.isWebGPURenderer === true;

  if (isWebGPU) {
    return <SmokeParticlesGPU {...props} />;
  }

  return <SmokeParticlesGL {...props} />;
}
