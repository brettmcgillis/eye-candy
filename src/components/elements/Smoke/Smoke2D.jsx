import React from 'react';

import { useThree } from '@react-three/fiber';

import Smoke2DGL from './Smoke2DGL';
import Smoke2DGPU from './Smoke2DGPU';

export default function Smoke2D(props) {
  const gl = useThree((state) => state.gl);
  const isWebGPU = gl?.isWebGPURenderer === true;

  if (isWebGPU) {
    return <Smoke2DGPU {...props} />;
  }

  return <Smoke2DGL {...props} />;
}
