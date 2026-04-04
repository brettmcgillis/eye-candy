import { useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { MAX_RANDOM_SPLATS } from '../../../../../materials/webGL/FluidMaterial/utils/constants';

export default function useFluidRandomSplats({ config, randomSplatQueueRef }) {
  const randomSplatsRef = useRef([]);
  const queueRef = randomSplatQueueRef;

  useFrame(() => {
    randomSplatsRef.current = [];

    if (!queueRef || queueRef.current <= 0) return;

    const batch = Math.min(queueRef.current, MAX_RANDOM_SPLATS);
    queueRef.current -= batch;
    const randomStrength = Math.max(0, config?.randomSplatStrength ?? 1);
    const randomForce = Math.max(
      0,
      config?.randomSplatForce ?? config?.splatForce ?? 2200
    );

    for (let i = 0; i < batch; i += 1) {
      randomSplatsRef.current.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() * 2 - 1) * randomForce * 0.08 * randomStrength,
        vy: (Math.random() * 2 - 1) * randomForce * 0.08 * randomStrength,
        hueMix: Math.random(),
        colorMix: Math.random() * 0.5,
        strength: (0.5 + Math.random() * 0.8) * randomStrength,
      });
    }
  });

  return randomSplatsRef;
}
