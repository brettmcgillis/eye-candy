/* eslint-disable no-param-reassign */
import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { writeStrokeSegmentRange } from '../utils/buildStrokeGeometry';
import { advanceEvolution, driftCoeffs } from '../utils/evolution';
import createRng from '../utils/rng';
import {
  computeStyles,
  generateStructure,
  growBundle,
} from '../utils/testGenerator';
import TestStrokes from './TestStrokes';

// Measured ~1.8µs/step; 1800 keeps growth/evolution work to ~3-4ms/frame
// regardless of Bundle Count/Strands Per Bundle/Curl Length — at extreme
// settings they just proceed slower in wall-clock time, never block. Growth
// and evolution share this one pool (see useFrame below) since a bundle can
// be in either phase on any given frame — giving each phase its own full
// budget would let per-frame work double whenever they overlap.
const GLOBAL_STRAND_STEP_BUDGET_PER_FRAME = 1800;
// Steps/second the tip advects at evolutionSpeed = 1. Tunable to taste.
const EVOLUTION_ADVECT_RATE = 25;

function extendPreservingExisting(ref, length, defaultValue) {
  while (ref.current.length < length) ref.current.push(defaultValue);
  ref.current.length = length;
}

// Structure (ODE search + integration, expensive) and style (color/visible/
// growthDelay, cheap) are independent memos so cosmetic control changes
// never re-trigger structural generation. Growth is real streaming
// integration — generateStructure only validates+seeds a prefix,
// growBundle() advances the rest a bit per frame here. No React state in
// the hot path (refs only, see docs/scene-performance-checklist.md).
//
// Growth and evolution are tracked per bundle, not scene-wide: a bundle
// whose Structural Override just changed regenerates and re-grows on its
// own while its siblings keep evolving uninterrupted (see
// testGenerator.js's generateStructure — unaffected bundles are reused by
// reference, and `previousBundlesRef` below is how this component tells
// "regenerated" from "unchanged").
function Test({
  seed,
  bundleCount,
  strandsPerBundle,
  steps,
  startSpread,
  coeffRange,
  freq,
  framingShape,
  boundRadius,
  boundWidth,
  boundHeight,
  minSpread,
  palette,
  flatten,
  growthDuration,
  evolutionEnabled,
  evolutionSpeed,
  smoothRespawns,
  trailFade,
  monochrome,
  inkColor,
  overrides,
}) {
  // Only the *structural* fields of `overrides` (Structural Override on +
  // its four values) should gate the structure memo below — style-only
  // edits (color, emissive, growth delay) must never trigger it. A stable
  // string dependency does that: content-equal strings compare equal for
  // useMemo even though a fresh one is built every render.
  const structuralFingerprint = useMemo(() => {
    const structural = {};
    Object.entries(overrides).forEach(([i, o]) => {
      if (o?.structuralOverride) {
        structural[i] = {
          startSpread: o.startSpread,
          coeffRange: o.coeffRange,
          freq: o.freq,
          framingShape: o.framingShape,
          boundRadius: o.boundRadius,
          boundWidth: o.boundWidth,
          boundHeight: o.boundHeight,
        };
      }
    });
    return JSON.stringify(structural);
  }, [overrides]);

  const previousBundlesRef = useRef(null);

  const structure = useMemo(
    () =>
      generateStructure(
        seed,
        {
          bundleCount,
          strandsPerBundle,
          steps,
          startSpread,
          coeffRange,
          freq,
          framingShape,
          boundRadius,
          boundWidth,
          boundHeight,
          minSpread,
          overrides,
        },
        previousBundlesRef.current
      ),
    [
      seed,
      bundleCount,
      strandsPerBundle,
      steps,
      startSpread,
      coeffRange,
      freq,
      framingShape,
      boundRadius,
      boundWidth,
      boundHeight,
      minSpread,
      structuralFingerprint,
    ]
  );

  const styles = useMemo(
    () =>
      computeStyles(seed, bundleCount, {
        monochrome,
        inkColor,
        palette,
        overrides,
      }),
    [seed, bundleCount, monochrome, inkColor, palette, overrides]
  );

  const evolutionRng = useMemo(() => createRng(seed + 0x9e3779b9), [seed]);

  const strokeRefs = useRef([]);
  const growthElapsedRef = useRef([]);
  const growthRatesRef = useRef([]);
  // Separate from bundle.grownSteps (data computed) — starts at 1 regardless
  // of how much of the validated prefix already exists, so that prefix
  // animates in too instead of popping in fully-formed. A bundle is done
  // growing once this reaches bundle.steps.
  const revealedStepsRef = useRef([]);

  // Resets only the bundles that actually regenerated this render (object
  // identity changed from last time) — reused bundles keep growing/evolving
  // exactly as they were. `growthRatesRef` is recomputed for everyone
  // whenever growthDuration changes, so an in-progress reveal re-paces
  // instead of restarting.
  useEffect(() => {
    const prevBundles = previousBundlesRef.current;
    previousBundlesRef.current = structure.bundles;

    extendPreservingExisting(growthElapsedRef, structure.bundles.length, 0);
    extendPreservingExisting(growthRatesRef, structure.bundles.length, 0);
    extendPreservingExisting(revealedStepsRef, structure.bundles.length, 1);

    structure.bundles.forEach((bundle, i) => {
      const effectiveDuration = overrides[i]?.growthDuration ?? growthDuration;
      growthRatesRef.current[i] =
        effectiveDuration > 0 ? bundle.steps / effectiveDuration : Infinity;

      const mesh = strokeRefs.current[i];
      if (!mesh) return;
      const isNew = !prevBundles || prevBundles[i] !== bundle;
      if (!isNew) return;

      growthElapsedRef.current[i] = 0;
      revealedStepsRef.current[i] = 1;
      writeStrokeSegmentRange(
        mesh.geometry,
        bundle.strands,
        0,
        bundle.grownSteps - 1
      );
      mesh.geometry.setDrawRange(0, 0);
      if (mesh.userData.grownStepsUniform) {
        mesh.userData.grownStepsUniform.value = bundle.grownSteps;
      }
      if (mesh.userData.fadeEnabledUniform) {
        mesh.userData.fadeEnabledUniform.value = 0;
      }
    });
  }, [structure, growthDuration, overrides]);

  useEffect(() => {
    structure.bundles.forEach((bundle, i) => {
      const mesh = strokeRefs.current[i];
      if (mesh) mesh.visible = styles[i]?.visible ?? true;
    });
  }, [structure, styles]);

  useFrame((_, delta) => {
    // Split the shared budget across every bundle with work this frame,
    // whichever phase each is in — fixed iteration order otherwise lets
    // early bundles hog it while later ones stall.
    const growingIndices = [];
    const evolvingIndices = [];

    structure.bundles.forEach((bundle, i) => {
      const mesh = strokeRefs.current[i];
      if (!mesh) return;

      if (revealedStepsRef.current[i] < bundle.steps) {
        growthElapsedRef.current[i] += delta;
        const growthDelay = styles[i]?.growthDelay ?? 0;
        if (growthElapsedRef.current[i] < growthDelay) return;
        growingIndices.push(i);
      } else if (evolutionEnabled && evolutionSpeed > 0) {
        evolvingIndices.push(i);
      }
    });

    const activeCount = growingIndices.length + evolvingIndices.length;
    if (activeCount === 0) return;
    const perBundleBudget = GLOBAL_STRAND_STEP_BUDGET_PER_FRAME / activeCount;

    growingIndices.forEach((i) => {
      const bundle = structure.bundles[i];
      const mesh = strokeRefs.current[i];
      const strandCount = bundle.strands.length;
      const rate = growthRatesRef.current[i] ?? Infinity;
      const stepDelta =
        rate === Infinity
          ? bundle.steps
          : Math.max(1, Math.round(rate * delta));

      if (bundle.grownSteps < bundle.steps) {
        const computeTarget = Math.min(
          bundle.steps - bundle.grownSteps,
          stepDelta
        );
        const affordableSteps = Math.max(
          0,
          Math.floor(perBundleBudget / strandCount)
        );
        const stepsThisFrame = Math.min(computeTarget, affordableSteps);
        if (stepsThisFrame > 0) {
          const prevGrown = bundle.grownSteps;
          growBundle(bundle, stepsThisFrame);
          writeStrokeSegmentRange(
            mesh.geometry,
            bundle.strands,
            prevGrown - 1,
            bundle.grownSteps - 1
          );
        }
      }

      // Capped by grownSteps — reveal can't outrun computed data, and just
      // pauses if a frame's budget share falls short.
      revealedStepsRef.current[i] = Math.min(
        bundle.grownSteps,
        revealedStepsRef.current[i] + stepDelta
      );

      mesh.geometry.setDrawRange(
        0,
        (revealedStepsRef.current[i] - 1) * strandCount * 2
      );
      if (mesh.userData.grownStepsUniform) {
        mesh.userData.grownStepsUniform.value = bundle.grownSteps;
      }
    });

    evolvingIndices.forEach((i) => {
      const bundle = structure.bundles[i];
      const mesh = strokeRefs.current[i];

      if (mesh.userData.fadeEnabledUniform) {
        mesh.userData.fadeEnabledUniform.value = trailFade ? 1 : 0;
      }

      driftCoeffs(bundle, evolutionRng, evolutionSpeed, delta);

      const strandCount = bundle.strands.length;
      const targetSteps = Math.max(
        1,
        Math.round(EVOLUTION_ADVECT_RATE * evolutionSpeed * delta)
      );
      const affordableSteps = Math.max(
        0,
        Math.floor(perBundleBudget / strandCount)
      );
      const stepsThisFrame = Math.min(targetSteps, affordableSteps);
      if (stepsThisFrame <= 0) return;

      const prevGrown = bundle.grownSteps;
      const rebased = advanceEvolution(bundle, stepsThisFrame, smoothRespawns);

      // A rebase shifts every point's buffer position, so the whole valid
      // range needs rewriting — otherwise just append what's new.
      if (rebased) {
        writeStrokeSegmentRange(
          mesh.geometry,
          bundle.strands,
          0,
          bundle.grownSteps - 1,
          bundle.respawnHiddenStep
        );
      } else {
        // respawnHiddenStep passed here too: a marker set this frame can
        // target a segment that isn't written until the next (incremental)
        // frame.
        writeStrokeSegmentRange(
          mesh.geometry,
          bundle.strands,
          prevGrown - 1,
          bundle.grownSteps - 1,
          bundle.respawnHiddenStep
        );
      }
      mesh.geometry.setDrawRange(0, (bundle.grownSteps - 1) * strandCount * 2);
      if (mesh.userData.grownStepsUniform) {
        mesh.userData.grownStepsUniform.value = bundle.grownSteps;
      }
    });
  });

  return (
    <group
      scale={[
        structure.scale,
        structure.scale,
        structure.scale * (1 - flatten),
      ]}
    >
      {structure.bundles.map((bundle, i) => (
        <TestStrokes
          key={bundle.id}
          hsl={styles[i]?.color ?? { h: 0, s: 0, l: 0.12 }}
          emissive={styles[i]?.emissive ?? false}
          emissiveIntensity={styles[i]?.emissiveIntensity ?? 2}
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
