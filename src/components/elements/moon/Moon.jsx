import React from 'react';

import { useThree } from '@react-three/fiber';

import WebGLMoon from './WebGLMoon';
import WebGPUMoon from './WebGPUMoon';

/**
 * Moon component wrapper that conditionally renders WebGL or WebGPU version
 * based on the active renderer. All props are passed through to the implementation.
 *
 * @param {Object} props - All props are passed to WebGLMoon or WebGPUMoon
 * @returns {JSX.Element}
 */
export default function Moon(props) {
  const gl = useThree((state) => state.gl);
  const isWebGPU = gl.isWebGLRenderer === false;

  return isWebGPU ? <WebGPUMoon {...props} /> : <WebGLMoon {...props} />;
}
