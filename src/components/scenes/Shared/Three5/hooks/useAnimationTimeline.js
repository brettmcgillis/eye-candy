/* eslint-disable no-param-reassign */
import { useEffect, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

export default function useAnimationTimeline(config, actionsRef) {
  const timeline = useMemo(
    () => ({
      elapsed: 0,
      phase: config.animationPhase,
      requested: config.animationPhase,
    }),
    []
  );
  useEffect(() => {
    timeline.elapsed =
      config.animationPlayback === 'loop' && config.animationPhase === 1
        ? 1 - Number.EPSILON
        : config.animationPhase;
    timeline.phase = config.animationPhase;
  }, [config.animationPhase, config.animationPlayback, timeline]);
  useEffect(() => {
    const actions = {
      restart: () => {
        timeline.elapsed = 0;
        timeline.phase = 0;
      },
      canvas: null,
    };
    actionsRef.current = actions;
    return () => {
      if (actionsRef.current === actions) actionsRef.current = null;
    };
  }, [actionsRef, timeline]);
  useFrame((_state, delta) => {
    if (config.animationPlaying)
      timeline.elapsed += delta / config.animationDuration;
    let phase = timeline.elapsed;
    if (config.animationPlayback === 'loop') {
      phase %= 1;
      if (
        config.experiment === 'washReveal' ||
        config.experiment === 'paintSequence'
      )
        phase = Math.min(1, phase / 0.85);
    }
    if (config.animationPlayback === 'ping-pong')
      phase = 1 - Math.abs(1 - ((phase * 2) % 2));
    phase = Math.min(1, Math.max(0, phase));
    timeline.requested = phase;
    if (config.animationEasing === 'smooth')
      phase = phase * phase * (3 - 2 * phase);
    if (config.animationEasing === 'sine')
      phase = (1 - Math.cos(phase * Math.PI)) / 2;
    timeline.phase = phase;
  }, -2);
  return timeline;
}
