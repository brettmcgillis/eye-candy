import { useEffect, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { cycleSeconds, growAt } from '@modules/subdivisionRelief';

import rollControls from '../utils/rollControls';

// split → hold → recombine, then the cycle's action; grow is in levels. Off,
// or on a live webcam, the piece holds fully split.
export default function useGrowClock(config, maxDepth, rig) {
  const elapsedRef = useRef(0);
  const configRef = useRef(config);
  configRef.current = config;
  const depthRef = useRef(maxDepth);
  depthRef.current = maxDepth;

  useEffect(() => {
    elapsedRef.current = 0;
  }, [config.seed]);

  useFrame((_, delta) => {
    const c = configRef.current;
    const top = depthRef.current + 1;
    if (!c.loop || c.webcam) {
      rig.setGrow(top);
      return;
    }
    const t = elapsedRef.current + Math.min(delta, 0.1);
    if (t < cycleSeconds(c)) {
      elapsedRef.current = t;
      rig.setGrow(growAt(t, c, top));
      return;
    }
    elapsedRef.current = 0;
    rig.setGrow(0);
    if (c.cycleMode !== 'regrow') {
      const what = c.cycleMode === 'roll' ? 'all' : 'seeds';
      c.setControlsRef.current?.(rollControls(c, what));
    }
  });
}
