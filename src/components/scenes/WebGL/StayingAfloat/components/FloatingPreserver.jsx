import React, { useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import LifePreserver from '@elements/LifePreserver/LifePreserver';
import { sampleWaveHeight, sampleWaveNormal } from '@elements/Water/waterUtils';

const BASE_X = 0.1;
const BASE_Z = 0.15;

export default function FloatingPreserver({
  interactionRuntime,
  waterTop,
  waveHeight,
  waveChoppiness,
  waveSpeed,
}) {
  const ref = useRef();

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;

    const surfaceHeight = interactionRuntime
      ? interactionRuntime.sampleHeight(
          BASE_X,
          BASE_Z,
          waveHeight,
          waveChoppiness,
          waveSpeed
        )
      : sampleWaveHeight(BASE_X, BASE_Z, waveHeight, waveChoppiness, waveSpeed);
    ref.current.position.y = waterTop + surfaceHeight;

    if (interactionRuntime) {
      const normal = interactionRuntime.sampleNormal(
        BASE_X,
        BASE_Z,
        waveHeight,
        waveChoppiness,
        waveSpeed
      );
      ref.current.rotation.x = Math.asin(-normal.z);
      ref.current.rotation.z = Math.asin(normal.x);
    } else {
      const n = sampleWaveNormal(
        BASE_X,
        BASE_Z,
        waveHeight,
        waveChoppiness,
        waveSpeed
      );
      ref.current.rotation.x = Math.asin(-n.z);
      ref.current.rotation.z = Math.asin(n.x);
    }

    // Gentle spin
    ref.current.rotation.y = t * 0.2;
  });

  return (
    <group ref={ref} position={[BASE_X, waterTop, BASE_Z]} scale={0.22}>
      <LifePreserver />
    </group>
  );
}
