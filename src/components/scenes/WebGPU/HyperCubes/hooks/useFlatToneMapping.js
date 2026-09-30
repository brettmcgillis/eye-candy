/* eslint-disable no-param-reassign */
import { useEffect } from 'react';

import { useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

// Both references present without a tone curve: clamp, bloom, encode.
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
