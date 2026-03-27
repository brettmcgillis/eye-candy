import React, { useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import LifePreserver from '../../../../../elements/lifePreserver/LifePreserver';
import {
  sampleWaveHeight,
  sampleWaveNormal,
} from '../../../../../elements/water/NurbsWaterColumn';

const BASE_X = 0.1;
const BASE_Z = 0.15;
const WATER_TOP = 3.0; // COLUMN_HEIGHT / 2

export default function FloatingPreserver({
  waveHeight,
  waveChoppiness,
  waveSpeed,
}) {
  const ref = useRef();

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;

    // Sample Gerstner wave surface at the preserver's XZ position
    const wY = sampleWaveHeight(
      BASE_X,
      BASE_Z,
      waveHeight,
      waveChoppiness,
      waveSpeed
    );
    ref.current.position.y = WATER_TOP + wY;

    // Tilt to match the wave surface normal
    const n = sampleWaveNormal(
      BASE_X,
      BASE_Z,
      waveHeight,
      waveChoppiness,
      waveSpeed
    );
    ref.current.rotation.x = Math.asin(-n.z);
    ref.current.rotation.z = Math.asin(n.x);

    // Gentle spin
    ref.current.rotation.y = t * 0.2;
  });

  return (
    <group ref={ref} position={[BASE_X, WATER_TOP, BASE_Z]} scale={0.22}>
      <LifePreserver />
    </group>
  );
}
