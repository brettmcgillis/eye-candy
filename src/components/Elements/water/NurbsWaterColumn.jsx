import React from 'react';

import { useThree } from '@react-three/fiber';

import NurbsWaterColumnGL from './NurbsWaterColumnGL';
import NurbsWaterColumnGPU from './NurbsWaterColumnGPU';

export default function NurbsWaterColumn(props) {
  const gl = useThree((state) => state.gl);

  if (gl?.isWebGPURenderer === true) {
    return <NurbsWaterColumnGPU {...props} />;
  }

  return <NurbsWaterColumnGL {...props} />;
}
