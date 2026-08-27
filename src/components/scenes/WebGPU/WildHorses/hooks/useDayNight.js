import { useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

const WAVE_REST = -5;

function ease(current, target, rate, delta) {
  return current + (target - current) * (1 - Math.exp(-rate * delta));
}

// wolf2's day/night switch is a spherical wipe, not a crossfade: a wave front
// starts past the far side of the dome and collapses toward the point the
// camera is looking at, revealing the incoming sky behind it and glowing along
// the front itself. `flip` swaps which texture is incoming so one graph serves
// both directions.
export default function useDayNight({
  nightLightIntensity,
  nightMode,
  terrainExtent,
  transitionRate,
  waveHeight,
  waveLength,
}) {
  const camera = useThree((state) => state.camera);
  const radius = terrainExtent * 0.75;

  const frontRef = useRef(WAVE_REST);
  const lightRef = useRef(1);
  const dayRef = useRef(nightMode ? 0 : 1);
  const nightRef = useRef(nightMode);

  const uniforms = useMemo(
    () => ({
      dayAmount: uniform(nightMode ? 0 : 1),
      flip: uniform(nightMode ? 1 : 0),
      lightIntensity: uniform(1),
      radius: uniform(radius),
      waveCenter: uniform(new THREE.Vector3(0, -0.5, -1)),
      waveFront: uniform(WAVE_REST),
      waveHeight: uniform(waveHeight),
      waveLength: uniform(waveLength),
    }),
    []
  );

  useEffect(() => {
    uniforms.radius.value = radius;
    uniforms.waveHeight.value = waveHeight;
    uniforms.waveLength.value = waveLength;
  }, [radius, uniforms, waveHeight, waveLength]);

  useEffect(() => {
    if (nightRef.current === nightMode) return;

    nightRef.current = nightMode;
    uniforms.flip.value = nightMode ? 1 : 0;
    uniforms.waveCenter.value.copy(camera.position).normalize();
    frontRef.current = radius * 2;
  }, [camera, nightMode, radius, uniforms]);

  useFrame((_, delta) => {
    frontRef.current = ease(frontRef.current, WAVE_REST, transitionRate, delta);
    uniforms.waveFront.value = frontRef.current;

    lightRef.current = ease(
      lightRef.current,
      nightMode ? nightLightIntensity : 1,
      transitionRate,
      delta
    );
    uniforms.lightIntensity.value = lightRef.current;

    dayRef.current = ease(
      dayRef.current,
      nightMode ? 0 : 1,
      transitionRate,
      delta
    );
    uniforms.dayAmount.value = dayRef.current;
  });

  return uniforms;
}
