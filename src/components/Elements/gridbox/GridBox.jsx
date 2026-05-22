import React from 'react';

import { useThree } from '@react-three/fiber';

import GridBoxGL from './GridBoxGL';
import GridBoxGPU from './GridBoxGPU';

export default function GridBox(props) {
  const gl = useThree((state) => state.gl);
  const isWebGPU = gl?.isWebGPURenderer === true;

  if (isWebGPU) {
    return <GridBoxGPU {...props} />;
  }

  return <GridBoxGL {...props} />;
}