import { useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { RANDOM_BURST_COUNT } from './fluidPresets';

export default function useFluidRandomSplats({ config, randomSplatQueueRef }) {
  const randomSplatsRef = useRef([]);
  const queueRef = randomSplatQueueRef;

  useFrame(() => {
    randomSplatsRef.current = [];

    if (!queueRef || queueRef.current <= 0) return;

    const batch = Math.min(queueRef.current, RANDOM_BURST_COUNT);
    queueRef.current -= batch;

    for (let i = 0; i < batch; i += 1) {
      randomSplatsRef.current.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() * 2 - 1) * config.splatForce * 0.08,
        vy: (Math.random() * 2 - 1) * config.splatForce * 0.08,
        hueMix: Math.random(),
        colorMix: Math.random() * 0.5,
        strength: 0.5 + Math.random() * 0.8,
      });
    }
  });

  return randomSplatsRef;
}
