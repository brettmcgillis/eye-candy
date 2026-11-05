/* eslint-disable no-param-reassign */
import { useEffect } from 'react';

import { useThree } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

// Paint, not film: Bloom's pipeline would run ACES over the paper and wash
// colours too, greying the white of the sheet.
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
