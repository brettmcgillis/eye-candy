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

// Global cap on RK4 steps computed per frame, summed across every strand of
// every bundle — measured ~1.8µs/step, so ~1800 keeps growth work to ~3-4ms,
// leaving headroom in the 16.6ms/frame budget for rendering. This is what
// keeps growth (and, below, evolution) from ever blocking the browser
// regardless of how large Bundle Count/Strands Per Bundle/Curl Length are
// set — at extreme settings growth/evolution just proceed slower in
// wall-clock time than requested, spread visibly across more frames, rather
// than freezing to hit an exact number.
const GLOBAL_STRAND_STEP_BUDGET_PER_FRAME = 1800;
// New steps/second the tip advects forward at evolutionSpeed = 1 — how fast
// the "flowing forward, tail disappearing" motion reads. Tunable to taste;
// this is a starting point, not a measured/derived value like the step
// budget above.
const EVOLUTION_ADVECT_RATE = 25;

// Owns one generated test. Structure (trajectories — expensive: ODE search +
// RK4 integration) and style (color/visible/growthDelay — cheap: no ODE math
// at all) are two independent memos, not one. Tweaking monochrome/inkColor/
// palette/Bundle Editor overrides used to re-run the *entire* structural
// generation, which is what made every control change feel like it locked
// the browser (todo.md) — style changes now never touch `structure` at all.
//
// Growth is real streaming integration, not a fake reveal over
// already-fully-computed data: generateStructure only validates each
// bundle's coefficients (a short, capped pass) and seeds `grownSteps` from
// that validated prefix — growBundle() then advances the rest a little per
// frame here, budgeted by GLOBAL_STRAND_STEP_BUDGET_PER_FRAME, paced to
// roughly land on `growthDuration` when the budget allows it. What you see
// growing in is the actual computation happening.
//
// No React state in the hot path (refs only, per
// docs/scene-performance-checklist.md). Two useFrame phases:
//   1. growth: budgeted growBundle() calls + incremental geometry writes,
//      offset per-bundle by styles[i].growthDelay
//   2. evolution: once fully grown, keeps advecting the tip forward
//      (advanceEvolution) while drifting coefficients (driftCoeffs) — never
//      a full recompute from t=0, just the next increment, same budgeting
//      as growth (see utils/evolution.js)
function Test({
  seed,
  bundleCount,
  strandsPerBundle,
  steps,
  startSpread,
  coeffRange,
  freq,
  palette,
  flatten,
  growthDuration,
  evolutionEnabled,
  evolutionSpeed,
  smoothRespawns,
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
      }),
    [seed, bundleCount, strandsPerBundle, steps, startSpread, coeffRange, freq]
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
  // Target new-steps-per-second per bundle, so growth paces toward
  // growthDuration when the global budget allows it. Recomputed whenever
  // structure or growthDuration changes (not on style-only changes).
  const growthRatesRef = useRef([]);

  // Structural: growth reset. Deliberately NOT keyed on `styles` — a color/
  // visibility tweak should never re-trigger the self-draw animation or
  // rewrite geometry. Draws in whatever validated prefix generateStructure
  // already seeded (real data, not a placeholder) immediately, then lets
  // useFrame's growBundle calls extend it from there.
  useEffect(() => {
    revealed.current = false;
    growthElapsed.current = 0;
    growthRatesRef.current = structure.bundles.map((bundle) => {
      const remaining = bundle.steps - bundle.grownSteps;
      return growthDuration > 0 ? remaining / growthDuration : Infinity;
    });

    structure.bundles.forEach((bundle, i) => {
      const mesh = strokeRefs.current[i];
      if (!mesh) return;
      const strandCount = bundle.strands.length;
      writeStrokeSegmentRange(
        mesh.geometry,
        bundle.strands,
        0,
        bundle.grownSteps - 1
      );
      mesh.geometry.setDrawRange(0, (bundle.grownSteps - 1) * strandCount * 2);
      if (mesh.userData.grownStepsUniform) {
        mesh.userData.grownStepsUniform.value = bundle.grownSteps;
      }
    });
  }, [structure, growthDuration]);

  // Style: visibility only — color flows straight through as a prop below,
  // growthDelay factors into pacing inside useFrame. Cheap and independent
  // of the structural effect above.
  useEffect(() => {
    structure.bundles.forEach((bundle, i) => {
      const mesh = strokeRefs.current[i];
      if (mesh) mesh.visible = styles[i]?.visible ?? true;
    });
  }, [structure, styles]);

  useFrame((_, delta) => {
    if (!revealed.current) {
      growthElapsed.current += delta;
      let remainingBudget = GLOBAL_STRAND_STEP_BUDGET_PER_FRAME;
      let allDone = true;

      structure.bundles.forEach((bundle, i) => {
        const mesh = strokeRefs.current[i];
        if (!mesh) return;
        if (bundle.grownSteps >= bundle.steps) return;

        // growthDelay is read fresh from `styles` every frame (never
        // mutated) and compared against elapsed wall-clock time since this
        // structure started growing — safe even if `styles` gets
        // recomputed mid-growth from an unrelated color/palette tweak.
        const growthDelay = styles[i]?.growthDelay ?? 0;
        if (growthElapsed.current < growthDelay) {
          allDone = false;
          return;
        }

        const strandCount = bundle.strands.length;
        const rate = growthRatesRef.current[i] ?? Infinity;
        const targetSteps =
          rate === Infinity
            ? bundle.steps - bundle.grownSteps
            : Math.max(1, Math.round(rate * delta));
        const affordableSteps = Math.max(
          0,
          Math.floor(remainingBudget / strandCount)
        );
        const stepsThisFrame = Math.min(targetSteps, affordableSteps);

        if (stepsThisFrame > 0) {
          const prevGrown = bundle.grownSteps;
          growBundle(bundle, stepsThisFrame);
          writeStrokeSegmentRange(
            mesh.geometry,
            bundle.strands,
            prevGrown - 1,
            bundle.grownSteps - 1
          );
          mesh.geometry.setDrawRange(
            0,
            (bundle.grownSteps - 1) * strandCount * 2
          );
          if (mesh.userData.grownStepsUniform) {
            mesh.userData.grownStepsUniform.value = bundle.grownSteps;
          }
          remainingBudget -= stepsThisFrame * strandCount;
        }

        if (bundle.grownSteps < bundle.steps) allDone = false;
      });

      if (allDone) revealed.current = true;
      return;
    }

    if (!evolutionEnabled || evolutionSpeed <= 0) return;

    let remainingBudget = GLOBAL_STRAND_STEP_BUDGET_PER_FRAME;

    structure.bundles.forEach((bundle, i) => {
      const mesh = strokeRefs.current[i];
      if (!mesh) return;

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

      // A rebase shifts every existing point's buffer position, so the
      // whole valid range needs rewriting — otherwise just append what's
      // new, same as growth.
      if (rebased) {
        writeStrokeSegmentRange(
          mesh.geometry,
          bundle.strands,
          0,
          bundle.grownSteps - 1,
          bundle.respawnHiddenStep
        );
      } else {
        // A respawn's hidden-segment marker can point at a segment that
        // doesn't exist yet — the marker is set the moment the strand's tip
        // resets, but the segment connecting it to the next real point only
        // gets written once that next point is grown, which can land on a
        // later, non-rebased/non-respawned frame that takes this incremental
        // path instead of the full-rewrite one above. Passing the marker
        // here too costs nothing for the (overwhelmingly common) case where
        // it's -1 for every strand.
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
