/* eslint-disable no-param-reassign */
import { useEffect } from 'react';

import { useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

// ACES greys the paper; Neutral keeps a white ground white.
export default function useNeutralToneMapping() {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const previous = gl.toneMapping;

    gl.toneMapping = THREE.NeutralToneMapping;

    return () => {
      gl.toneMapping = previous;
    };
  }, [gl]);
}
