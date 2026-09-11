/* eslint-disable no-param-reassign */
import { useEffect, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

const SETTLED = 1000;

// One unbounded clock. Cells hold the value they were born at, so the same
// ramp plays the opening sweep and every later rebuild without ever resetting.
export default function useBuildClock({
  buildIn,
  buildSeconds,
  resetKey,
  uniforms,
}) {
  const clockRef = useRef(0);

  useEffect(() => {
    clockRef.current = buildIn ? 0 : SETTLED;
    uniforms.build.value = clockRef.current;
  }, [buildIn, resetKey, uniforms]);

  useFrame((_, delta) => {
    clockRef.current += delta / Math.max(buildSeconds, 0.01);
    uniforms.build.value = clockRef.current;
  });

  return clockRef;
}
