import React from 'react';

import { useThree } from '@react-three/fiber';

import FireballGL from './FireballGL';
import FireballGPU from './FireballGPU';

export default function Fireball(props) {
  const gl = useThree((state) => state.gl);
  const isWebGPU = gl?.isWebGPURenderer === true;

  if (isWebGPU) {
    return <FireballGPU {...props} />;
  }

  return <FireballGL {...props} />;
}
