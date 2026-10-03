/* eslint-disable no-param-reassign */
import { useEffect } from 'react';

import { useThree } from '@react-three/fiber';

export default function useExposure(exposure) {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const previous = gl.toneMappingExposure;
    gl.toneMappingExposure = exposure;
    return () => {
      gl.toneMappingExposure = previous;
    };
  }, [exposure, gl]);
}
