import { useEffect, useRef } from 'react';

import { useThree } from '@react-three/fiber';

// Cursor position as a plain `{x,y}` ref in screen UV space (0..1), origin
// top-left — matches WebGPU's `screenCoordinate`/DOM `clientX/Y` convention
// directly, no y-flip needed. Read from `useFrame` (a ref, not state, so it
// doesn't cause re-renders on every pointer move) and pushed into
// `updateFractalPixelateUniforms({ pointerUV, pointerStrength })`.
export default function useFractalPixelatePointer() {
  const { gl: renderer } = useThree();
  const pointerRef = useRef({ x: -1, y: -1, active: false });

  useEffect(() => {
    const element = renderer.domElement;

    const updatePointer = (event) => {
      const rect = element.getBoundingClientRect();
      pointerRef.current.x = (event.clientX - rect.left) / rect.width;
      pointerRef.current.y = (event.clientY - rect.top) / rect.height;
      pointerRef.current.active = true;
    };

    const clearPointer = () => {
      pointerRef.current.active = false;
    };

    element.addEventListener('pointermove', updatePointer);
    element.addEventListener('pointerleave', clearPointer);
    element.addEventListener('pointercancel', clearPointer);
    window.addEventListener('blur', clearPointer);

    return () => {
      element.removeEventListener('pointermove', updatePointer);
      element.removeEventListener('pointerleave', clearPointer);
      element.removeEventListener('pointercancel', clearPointer);
      window.removeEventListener('blur', clearPointer);
    };
  }, [renderer]);

  return pointerRef;
}
