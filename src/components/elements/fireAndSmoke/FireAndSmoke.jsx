import React from 'react';

import { useThree } from '@react-three/fiber';

import FireAndSmokeGL from './FireAndSmokeGL';
import FireAndSmokeGPU from './FireAndSmokeGPU';

export default function FireAndSmoke(props) {
  const gl = useThree((state) => state.gl);
  const isWebGPU = gl?.isWebGPURenderer === true;

  if (isWebGPU) {
    return <FireAndSmokeGPU {...props} />;
  }

  return <FireAndSmokeGL {...props} />;
}
