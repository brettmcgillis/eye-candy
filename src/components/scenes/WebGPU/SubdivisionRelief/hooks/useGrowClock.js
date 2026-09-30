import { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { uniform } from 'three/tsl';

import rollControls from '../utils/rollControls';

// split → hold → recombine, then the cycle's action; `grow` is in levels (see
// splitProgress). Off, or on a live webcam, the piece holds fully split.
export default function useGrowClock(config, maxDepth) {
  const grow = useMemo(() => uniform(0), []);
  const elapsedRef = useRef(0);
  const configRef = useRef(config);
  configRef.current = config;
  const depthRef = useRef(maxDepth);
  depthRef.current = maxDepth;

  useEffect(() => {
    elapsedRef.current = 0;
  }, [config.seed]);

  useFrame((_, delta) => {
    const {
      collapseSeconds,
      cycleMode,
      growSeconds,
      holdSeconds,
      loop,
      webcam,
    } = configRef.current;
    const top = depthRef.current + 1;
    if (!loop || webcam) {
      grow.value = top;
      return;
    }
    const t = elapsedRef.current + Math.min(delta, 0.1);
    elapsedRef.current = t;

    if (t < growSeconds) grow.value = (t / growSeconds) * top;
    else if (t < growSeconds + holdSeconds) grow.value = top;
    else if (t < growSeconds + holdSeconds + collapseSeconds) {
      grow.value =
        top * (1 - (t - growSeconds - holdSeconds) / collapseSeconds);
    } else {
      grow.value = 0;
      elapsedRef.current = 0;
      if (cycleMode !== 'regrow') {
        const what = cycleMode === 'roll' ? 'all' : 'seeds';
        configRef.current.setControlsRef.current?.(
          rollControls(configRef.current, what)
        );
      }
    }
  });

  return grow;
}
