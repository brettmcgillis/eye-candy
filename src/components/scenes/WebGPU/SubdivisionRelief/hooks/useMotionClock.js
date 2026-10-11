import { useRef } from 'react';

import { useFrame } from '@react-three/fiber';

const EASE = 3;

// Phases accumulate speed × dt, so a speed change never jumps the pattern,
// and Animate eases the motion in and out instead of snapping heights.
export default function useMotionClock(config, rig) {
  const stateRef = useRef({ mix: 0, noisePhase: 0, wavePhase: 0 });
  const configRef = useRef(config);
  configRef.current = config;

  useFrame((_, delta) => {
    const c = configRef.current;
    const s = stateRef.current;
    const dt = Math.min(delta, 0.1);
    s.mix += ((c.animate ? 1 : 0) - s.mix) * (1 - Math.exp(-EASE * dt));
    if (s.mix > 1e-3) {
      s.noisePhase += dt * c.motionNoiseSpeed;
      s.wavePhase += dt * c.motionWaveSpeed;
    }
    rig.setMotion(s);
  });
}
