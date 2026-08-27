/* eslint-disable no-param-reassign */
import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  GROWTH_BASE_RATE,
  advanceEvolution,
  computeStyles,
  createRng,
  driftCoeffs,
  generateStructure,
  growBundle,
  writeStrokeSegmentRange,
} from '@modules/rorschach';

import InkLayer from './InkLayer';
import TestStrokes from './TestStrokes';

// Measured ~1.8µs/step. Growth (a short, front-loaded burst while a Test is
// blooming in) and evolution (runs continuously for as long as the scene is
// open) used to share one 1800-step pool, so more bundles growing at once
// meant *every* bundle grew slower — Growth Speed stopped meaning what it
// said the moment Bundle Count changed. Split into two pools instead: growth
// gets a bigger dedicated budget since it's transient, evolution keeps the
// original size since it's ongoing. Worst case both fire in the same frame
// (some bundles still growing while others already evolve), so it's the
// *sum* that has to stay safely under a 16.67ms (60fps) frame budget:
// (3600+1800) steps * 1.8µs ≈ 9.7ms, leaving ~7ms for actual rendering. At
// settings extreme enough to exceed even that, bundles just proceed slower
// in wall-clock time — same "never blocks" guarantee as the single pool had.
const GROWTH_STEP_BUDGET_PER_FRAME = 3600;
const EVOLUTION_STEP_BUDGET_PER_FRAME = 1800;
// Steps/second the tip advects at evolutionSpeed = 1. Tunable to taste.
const EVOLUTION_ADVECT_RATE = 25;
// A per-bundle Structural Override's own Growth Duration (seconds) means
// literally "this bundle takes exactly N seconds" — only the *global*
// control is a rate, so cranking Curl Length up doesn't silently demand
// more throughput to keep the same apparent pace.

function resolveGrowthRate(steps, overrideDuration, growthSpeed) {
  if (overrideDuration !== undefined) {
    return overrideDuration > 0 ? steps / overrideDuration : Infinity;
  }
  return growthSpeed > 0 ? GROWTH_BASE_RATE * growthSpeed : Infinity;
}
// generateStructure's ODE search runs synchronously in a render-phase memo
// (see below) and can stall the main thread for a frame or more, especially
// right after a Continuous Mode reroll. Without this clamp, the first frame
// back gets an inflated `delta`, and every rate*delta pacing calc below
// (growth reveal, evolution advect) reads it as "a lot of time passed" and
// jumps forward in one big step — a visible speed-up right at the moment a
// Test starts, followed by normal pacing once delta recovers. Clamping caps
// that jump at what a single frame would cover at ~20fps.
const MAX_FRAME_DELTA = 1 / 20;

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
  paletteExact,
  paletteShuffleSeed,
  flatten,
  flattenAxis,
  growthSpeed,
  growthStyle,
  continuousMode,
  continuousModeDelay,
  onGrowthComplete,
  evolutionEnabled,
  evolutionSpeed,
  curlLimit,
  smoothRespawns,
  trailFade,
  monochrome,
  inkColor,
  overrides,
  flattenRef,
  lines,
  ink,
  inkSettings,
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
        paletteExact,
        paletteShuffleSeed,
        overrides,
      }),
    [
      seed,
      bundleCount,
      monochrome,
      inkColor,
      palette,
      paletteExact,
      paletteShuffleSeed,
      overrides,
    ]
  );

  const evolutionRng = useMemo(() => createRng(seed + 0x9e3779b9), [seed]);

  const groupRef = useRef(null);
  const strokeRefs = useRef([]);
  const growthElapsedRef = useRef([]);
  const growthRatesRef = useRef([]);
  // Growth Style 'sequential' stagger: bundle i's growth doesn't start
  // until every earlier bundle's *estimated* duration (steps / its own
  // rate) has elapsed, so bundles bloom one at a time instead of together.
  // Zero for every bundle in 'unison' mode. Added on top of styles[i]'s own
  // growthDelay (Bundle Editor's per-bundle art-direction), not instead of.
  const sequentialStartDelayRef = useRef([]);
  // Separate from bundle.grownSteps (data computed) — starts at 1 regardless
  // of how much of the validated prefix already exists, so that prefix
  // animates in too instead of popping in fully-formed. A bundle is done
  // growing once this reaches bundle.steps.
  const revealedStepsRef = useRef([]);
  // Continuous Mode's hold-before-reroll timer: accumulates once all
  // bundles finish growing, fires onGrowthComplete once continuousModeDelay
  // is reached, then latches via continuousTriggeredRef so it doesn't fire
  // again every frame the Test then sits fully-grown waiting to be replaced.
  const continuousHoldRef = useRef(0);
  const continuousTriggeredRef = useRef(false);

  // Resets only the bundles that actually regenerated this render (object
  // identity changed from last time) — reused bundles keep growing/evolving
  // exactly as they were. `growthRatesRef`/`sequentialStartDelayRef` are
  // recomputed for everyone whenever growthSpeed/growthStyle changes, so an
  // in-progress reveal re-paces instead of restarting.
  useEffect(() => {
    const prevBundles = previousBundlesRef.current;
    previousBundlesRef.current = structure.bundles;

    extendPreservingExisting(growthElapsedRef, structure.bundles.length, 0);
    extendPreservingExisting(growthRatesRef, structure.bundles.length, 0);
    extendPreservingExisting(
      sequentialStartDelayRef,
      structure.bundles.length,
      0
    );
    extendPreservingExisting(revealedStepsRef, structure.bundles.length, 1);

    let cumulativeStartDelay = 0;
    structure.bundles.forEach((bundle, i) => {
      const rate = resolveGrowthRate(
        bundle.steps,
        overrides[i]?.growthDuration,
        growthSpeed
      );
      growthRatesRef.current[i] = rate;

      sequentialStartDelayRef.current[i] =
        growthStyle === 'sequential' ? cumulativeStartDelay : 0;
      if (growthStyle === 'sequential') {
        cumulativeStartDelay += rate === Infinity ? 0 : bundle.steps / rate;
      }

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
  }, [structure, growthSpeed, growthStyle, overrides]);

  useEffect(() => {
    structure.bundles.forEach((bundle, i) => {
      const mesh = strokeRefs.current[i];
      if (mesh) mesh.visible = lines !== false && (styles[i]?.visible ?? true);
    });
  }, [lines, structure, styles]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, MAX_FRAME_DELTA);

    // Split each phase's own budget across every bundle in that phase this
    // frame — fixed iteration order otherwise lets early bundles hog it
    // while later ones stall.
    const growingIndices = [];
    const evolvingIndices = [];
    let allBundlesGrown = true;

    // No mesh guard here on purpose: growth and evolution are trajectory data
    // the ink layer consumes too, so they have to advance whether or not the
    // Lines layer is drawing them. Only the geometry writes below are
    // conditional on a mesh existing.
    structure.bundles.forEach((bundle, i) => {
      if (revealedStepsRef.current[i] < bundle.steps) {
        allBundlesGrown = false;
        growthElapsedRef.current[i] += delta;
        const growthDelay =
          (styles[i]?.growthDelay ?? 0) +
          (sequentialStartDelayRef.current[i] ?? 0);
        if (growthElapsedRef.current[i] < growthDelay) return;
        growingIndices.push(i);
      } else if (evolutionEnabled && evolutionSpeed > 0) {
        evolvingIndices.push(i);
      }
    });

    if (continuousMode) {
      if (allBundlesGrown) {
        continuousHoldRef.current += delta;
        if (
          !continuousTriggeredRef.current &&
          continuousHoldRef.current >= continuousModeDelay
        ) {
          continuousTriggeredRef.current = true;
          onGrowthComplete?.();
        }
      } else {
        continuousHoldRef.current = 0;
        continuousTriggeredRef.current = false;
      }
    }

    if (growingIndices.length + evolvingIndices.length === 0) return;
    const perGrowingBudget =
      growingIndices.length > 0
        ? GROWTH_STEP_BUDGET_PER_FRAME / growingIndices.length
        : 0;
    const perEvolvingBudget =
      evolvingIndices.length > 0
        ? EVOLUTION_STEP_BUDGET_PER_FRAME / evolvingIndices.length
        : 0;

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
          Math.floor(perGrowingBudget / strandCount)
        );
        const stepsThisFrame = Math.min(computeTarget, affordableSteps);
        if (stepsThisFrame > 0) {
          const prevGrown = bundle.grownSteps;
          growBundle(bundle, stepsThisFrame);
          if (mesh) {
            writeStrokeSegmentRange(
              mesh.geometry,
              bundle.strands,
              prevGrown - 1,
              bundle.grownSteps - 1
            );
          }
        }
      }

      // Capped by grownSteps — reveal can't outrun computed data, and just
      // pauses if a frame's budget share falls short.
      revealedStepsRef.current[i] = Math.min(
        bundle.grownSteps,
        revealedStepsRef.current[i] + stepDelta
      );

      if (!mesh) return;
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

      if (mesh?.userData.fadeEnabledUniform) {
        mesh.userData.fadeEnabledUniform.value = trailFade ? 1 : 0;
      }

      driftCoeffs(bundle, evolutionRng, evolutionSpeed, delta, curlLimit);

      const strandCount = bundle.strands.length;
      const targetSteps = Math.max(
        1,
        Math.round(EVOLUTION_ADVECT_RATE * evolutionSpeed * delta)
      );
      const affordableSteps = Math.max(
        0,
        Math.floor(perEvolvingBudget / strandCount)
      );
      const stepsThisFrame = Math.min(targetSteps, affordableSteps);
      if (stepsThisFrame <= 0) return;

      const prevGrown = bundle.grownSteps;
      const rebased = advanceEvolution(
        bundle,
        stepsThisFrame,
        smoothRespawns,
        minSpread
      );

      if (!mesh) return;

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

    // Cinematic Mode animates flatten every frame (see CinematicMode.jsx) —
    // applied here off a ref rather than through the `flatten` prop so it
    // never re-renders the scene. Untouched when the ref is null, leaving the
    // Leva-driven scale on the group below in charge.
    const overrideFlatten = flattenRef?.current;
    if (groupRef.current && overrideFlatten != null) {
      const squash = 1 - overrideFlatten;
      if (flattenAxis === 'y') {
        groupRef.current.scale.set(
          structure.scale,
          structure.scale * squash,
          structure.scale
        );
      } else {
        groupRef.current.scale.set(
          structure.scale,
          structure.scale,
          structure.scale * squash
        );
      }
    }
  });

  return (
    <>
      <group
        ref={groupRef}
        scale={
          flattenAxis === 'y'
            ? [
                structure.scale,
                structure.scale * (1 - flatten),
                structure.scale,
              ]
            : [
                structure.scale,
                structure.scale,
                structure.scale * (1 - flatten),
              ]
        }
      >
        {structure.bundles.map((bundle, i) => (
          <TestStrokes
            key={bundle.id}
            visible={lines !== false && (styles[i]?.visible ?? true)}
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
      {ink && (
        <InkLayer
          backdropColor={inkSettings.backdropColor}
          bloom={inkSettings.bloom}
          desaturate={inkSettings.desaturate}
          recede={inkSettings.recede}
          tonalGap={inkSettings.tonalGap}
          bloomEmissiveOnly={inkSettings.bloomEmissiveOnly}
          bloomSource={inkSettings.bloomSource}
          bloomStrength={inkSettings.bloomStrength}
          bloomThreshold={inkSettings.bloomThreshold}
          cellAmount={inkSettings.cellAmount}
          cellFlatten={inkSettings.cellFlatten}
          cellReveal={inkSettings.cellReveal}
          cellRevealScale={inkSettings.cellRevealScale}
          cellScale={inkSettings.cellScale}
          cellSymmetry={inkSettings.cellSymmetry}
          offset={inkSettings.offset}
          paletteMix={inkSettings.paletteMix}
          paletteScale={inkSettings.paletteScale}
          paletteSymmetry={inkSettings.paletteSymmetry}
          orientation={inkSettings.orientation}
          paperGrain={inkSettings.paperGrain}
          paperSize={inkSettings.paperSize}
          patternDensity={inkSettings.patternDensity}
          patternDetails={inkSettings.patternDetails}
          patternFade={inkSettings.patternFade}
          patternFlow={inkSettings.patternFlow}
          patternScale={inkSettings.patternScale}
          patternSharpness={inkSettings.patternSharpness}
          patternSoftness={inkSettings.patternSoftness}
          patternSpeed={inkSettings.patternSpeed}
          patternSymmetry={inkSettings.patternSymmetry}
          patternWash={inkSettings.patternWash}
          resolution={inkSettings.resolution}
          seed={seed}
          steps={inkSettings.stepsPerFrame}
          styles={styles}
        />
      )}
    </>
  );
}

export default memo(Test);
