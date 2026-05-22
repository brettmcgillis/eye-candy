import React from 'react';

import { useThree } from '@react-three/fiber';

import FireAndSmoke from './FireAndSmoke';
import FireAndSmokeGPU from './FireAndSmokeGPU';

export default function FireAndSmokeRenderer(props) {
  const gl = useThree((state) => state.gl);
  const isWebGPU = gl?.isWebGPURenderer === true;

  if (isWebGPU) {
    return <FireAndSmokeGPU {...props} />;
  }

  return <FireAndSmoke {...props} />;
}
