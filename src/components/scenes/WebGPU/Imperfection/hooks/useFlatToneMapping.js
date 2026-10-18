/* eslint-disable no-param-reassign */
import { useEffect } from 'react';

import { useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

// The painting encodes its own colour; tone mapping would bend it.
export default function useFlatToneMapping() {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const previous = gl.toneMapping;
    gl.toneMapping = THREE.NoToneMapping;
    return () => {
      gl.toneMapping = previous;
    };
  }, [gl]);
}
