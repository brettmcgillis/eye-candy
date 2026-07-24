import React from 'react';

import { useThree } from '@react-three/fiber';

import FurGL from './FurGL';
import FurGPU from './FurGPU';

export default function Fur(props) {
  const gl = useThree((state) => state.gl);
  const isWebGPU = gl?.isWebGPURenderer === true;

  if (isWebGPU) {
    return <FurGPU {...props} />;
  }

  return <FurGL {...props} />;
}
