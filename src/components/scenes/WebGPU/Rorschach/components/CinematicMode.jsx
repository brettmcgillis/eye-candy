import { useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { cinematicState } from '../utils/cinematic';

// Drives the sweep described in todo.md: the camera orbits continuously, each
// system draws itself in over its own half-revolution, flattens as the camera
// reaches the far side, and is replaced as the camera passes behind.
//
// Timing comes from utils/cinematic.js, the same module
// scripts/rorschach-video.mjs uses for `--mode cinematic`, so the in-app sweep
// and the rendered one can't drift.
//
// `flattenRef` is written rather than a Leva control being set: flatten moves
// every frame, and pushing that through the panel would re-render the whole
// scene 60 times a second. Test.jsx reads the ref straight from its own
// useFrame instead.
export default function CinematicMode({
  enabled,
  flattenRef,
  onSystemChange,
  secondsPerSystem,
}) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls);
  const startRef = useRef(0);
  const systemRef = useRef(0);
  const distanceRef = useRef(22);

  useEffect(() => {
    if (!enabled) {
      // eslint-disable-next-line no-param-reassign
      flattenRef.current = null;
      return;
    }
    startRef.current = performance.now() / 1000;
    systemRef.current = 0;
    if (controls) {
      distanceRef.current = camera.position.distanceTo(controls.target);
    }
  }, [camera, controls, enabled, flattenRef]);

  useFrame(() => {
    if (!enabled || !controls) return;

    const elapsed = performance.now() / 1000 - startRef.current;
    const state = cinematicState(elapsed, { secondsPerSystem });

    const distance = distanceRef.current;
    camera.position.set(
      Math.sin(state.azimuth) * distance,
      camera.position.y,
      Math.cos(state.azimuth) * distance
    );
    controls.target.set(0, 0, 0);
    controls.update();

    // eslint-disable-next-line no-param-reassign
    flattenRef.current = state.flatten;

    if (state.systemIndex !== systemRef.current) {
      systemRef.current = state.systemIndex;
      onSystemChange();
    }
  });

  return null;
}
