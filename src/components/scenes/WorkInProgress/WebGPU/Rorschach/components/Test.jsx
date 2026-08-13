import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { writeStrokePositions } from '../utils/buildStrokeGeometry';
import evolveBundle from '../utils/evolution';
import createRng from '../utils/rng';
import generateTest from '../utils/testGenerator';
import TestStrokes from './TestStrokes';

// Owns one generated test: builds it from the seed + generation settings,
// then drives two useFrame phases with no React state in the hot path (refs
// only, per docs/scene-performance-checklist.md) —
//   1. growth reveal: setDrawRange sweeps from 0 to full over growthDuration
//   2. evolution: once revealed, nudges each bundle's coefficients every
//      frame and rewrites its geometry in place (see utils/evolution.js)
function Test({
  seed,
  bundleCount,
  strandsPerBundle,
  steps,
  startSpread,
  coeffRange,
  freq,
  growthDuration,
  evolutionSpeed,
  monochrome,
}) {
  const test = useMemo(
    () =>
      generateTest(seed, {
        monochrome,
        bundleCount,
        strandsPerBundle,
        steps,
        startSpread,
        coeffRange,
        freq,
      }),
    [
      seed,
      monochrome,
      bundleCount,
      strandsPerBundle,
      steps,
      startSpread,
      coeffRange,
      freq,
    ]
  );
  const evolutionRng = useMemo(() => createRng(seed + 0x9e3779b9), [seed]);

  const strokeRefs = useRef([]);
  const growthElapsed = useRef(0);
  const revealed = useRef(false);

  useEffect(() => {
    growthElapsed.current = 0;
    revealed.current = false;
    test.bundles.forEach((bundle, i) => {
      const mesh = strokeRefs.current[i];
      if (!mesh) return;
      writeStrokePositions(mesh.geometry, bundle.strands, bundle.steps);
      mesh.geometry.setDrawRange(0, 0);
    });
  }, [test]);

  useFrame((_, delta) => {
    if (!revealed.current) {
      growthElapsed.current += delta;
      const progress =
        growthDuration > 0
          ? Math.min(1, growthElapsed.current / growthDuration)
          : 1;

      test.bundles.forEach((bundle, i) => {
        const mesh = strokeRefs.current[i];
        if (!mesh) return;
        const strandCount = bundle.strands.length;
        const revealedSteps = Math.floor(progress * (bundle.steps - 1));
        mesh.geometry.setDrawRange(0, revealedSteps * strandCount * 2);
      });

      if (progress >= 1) revealed.current = true;
      return;
    }

    if (evolutionSpeed <= 0) return;

    test.bundles.forEach((bundle, i) => {
      evolveBundle(bundle, evolutionRng, evolutionSpeed, delta);
      const mesh = strokeRefs.current[i];
      if (mesh)
        writeStrokePositions(mesh.geometry, bundle.strands, bundle.steps);
    });
  });

  return (
    <group scale={test.scale}>
      {test.bundles.map((bundle, i) => (
        <TestStrokes
          key={bundle.id}
          hsl={bundle.color}
          strandCount={bundle.strands.length}
          steps={bundle.steps}
          ref={(el) => {
            strokeRefs.current[i] = el;
          }}
        />
      ))}
    </group>
  );
}

export default memo(Test);
