import React from 'react';

import { useThree } from '@react-three/fiber';

import FlameGL from './FlameGL';
import FlameGPU from './FlameGPU';

export default function Flame(props) {
  const gl = useThree((state) => state.gl);
  const isWebGPU = gl?.isWebGPURenderer === true;

  if (isWebGPU) {
    return <FlameGPU {...props} />;
  }

  return <FlameGL {...props} />;
}
