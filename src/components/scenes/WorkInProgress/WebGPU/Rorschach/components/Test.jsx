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
// settings they just proceed slower in wall-clock time, never block.
const GLOBAL_STRAND_STEP_BUDGET_PER_FRAME = 1800;
// Steps/second the tip advects at evolutionSpeed = 1. Tunable to taste.
const EVOLUTION_ADVECT_RATE = 25;

// Structure (ODE search + integration, expensive) and style (color/visible/
// growthDelay, cheap) are independent memos so cosmetic control changes
// never re-trigger structural generation. Growth is real streaming
// integration — generateStructure only validates+seeds a prefix,
// growBundle() advances the rest a bit per frame here. No React state in
// the hot path (refs only, see docs/scene-performance-checklist.md).
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
  const structure = useMemo(
    () =>
      generateStructure(seed, {
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
      }),
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
  const revealed = useRef(false);
  const growthElapsed = useRef(0);
  const growthRatesRef = useRef([]);
  // Separate from bundle.grownSteps (data computed) — starts at 1 regardless
  // of how much of the validated prefix already exists, so that prefix
  // animates in too instead of popping in fully-formed.
  const revealedStepsRef = useRef([]);

  // Not keyed on `styles` — a color/visibility tweak must never re-trigger
  // the self-draw animation.
  useEffect(() => {
    revealed.current = false;
    growthElapsed.current = 0;
    growthRatesRef.current = structure.bundles.map((bundle) =>
      growthDuration > 0 ? bundle.steps / growthDuration : Infinity
    );
    revealedStepsRef.current = structure.bundles.map(() => 1);

    structure.bundles.forEach((bundle, i) => {
      const mesh = strokeRefs.current[i];
      if (!mesh) return;
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
  }, [structure, growthDuration]);

  useEffect(() => {
    structure.bundles.forEach((bundle, i) => {
      const mesh = strokeRefs.current[i];
      if (mesh) mesh.visible = styles[i]?.visible ?? true;
    });
  }, [structure, styles]);

  useFrame((_, delta) => {
    if (!revealed.current) {
      growthElapsed.current += delta;

      // Split the budget evenly across bundles still growing this frame —
      // fixed iteration order otherwise lets early bundles hog it while
      // later ones stall, reading as sequential rather than simultaneous.
      const activeIndices = [];
      let allDone = true;

      structure.bundles.forEach((bundle, i) => {
        const mesh = strokeRefs.current[i];
        if (!mesh) return;
        if (revealedStepsRef.current[i] >= bundle.steps) return;

        allDone = false;
        const growthDelay = styles[i]?.growthDelay ?? 0;
        if (growthElapsed.current < growthDelay) return;
        activeIndices.push(i);
      });

      if (activeIndices.length > 0) {
        const perBundleBudget =
          GLOBAL_STRAND_STEP_BUDGET_PER_FRAME / activeIndices.length;

        activeIndices.forEach((i) => {
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

          // Capped by grownSteps — reveal can't outrun computed data, and
          // just pauses if a frame's budget share falls short.
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
      }

      if (allDone) revealed.current = true;
      return;
    }

    if (!evolutionEnabled || evolutionSpeed <= 0) return;

    let remainingBudget = GLOBAL_STRAND_STEP_BUDGET_PER_FRAME;

    structure.bundles.forEach((bundle, i) => {
      const mesh = strokeRefs.current[i];
      if (!mesh) return;

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
        Math.floor(remainingBudget / strandCount)
      );
      const stepsThisFrame = Math.min(targetSteps, affordableSteps);
      if (stepsThisFrame <= 0) return;

      const prevGrown = bundle.grownSteps;
      const rebased = advanceEvolution(bundle, stepsThisFrame, smoothRespawns);
      remainingBudget -= stepsThisFrame * strandCount;

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
