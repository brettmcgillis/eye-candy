/* eslint-disable no-param-reassign */
// Mutates bundle.coeffs and strand buffers in place — see
// utils/testGenerator.js and utils/odeIntegrator.js for the same pattern.
import { growBundle } from './testGenerator';

// Fraction of a coefficient's magnitude nudged per second at
// evolutionSpeed = 1.
const DRIFT_STEP = 0.012;
// Fraction of the distance back toward the bundle's original (validated,
// known-bounded) coefficients pulled in per second at evolutionSpeed = 1.
// Without this, pure random-walk drift is a drunkard's walk: given enough
// time it wanders into coefficient combinations where more and more
// individual strands' stepRK4 calls go unstable and freeze (each one safe
// on its own, but the cumulative effect reads as the whole beast slowly
// withering down to a few surviving strands). Mean-reverting drift keeps
// the field oscillating around a configuration that's actually been
// verified to work, instead of decaying away from one.
const REVERSION_RATE = 0.15;
// Extra hard safety net on top of mean reversion — shouldn't normally bind,
// since reversion already keeps coefficients orbiting close to their
// original (generation-time) values.
const COEFF_DRIFT_CLAMP = 3;
// How much of the window gets dropped at once when the tip advects past the
// end of the buffer and it needs to make room. Small and frequent rather
// than a big chunk: TestStrokes.jsx fades opacity toward the tail based on
// FADE_FRACTION (see there), and for that fade to actually finish before a
// point is dropped, the drop chunk needs to stay well inside the fade
// window — dropCount/fadeWindow is roughly the residual opacity a point
// still has right as it's removed. At 0.03 that's a few percent, not the
// ~75% it was at the old 0.15/0.2 pairing (which is why it looked like it
// popped instead of fading — the fade genuinely hadn't finished).
const REBASE_FRACTION = 0.03;
// How many trailing buffer *positions* (not advanceEvolution calls — see
// below) a single strand can accumulate at the same frozen value before
// it's respawned from its own (validated) start point. Mean reversion alone
// isn't enough: bundle-level validation only checks a probe point over a
// bounded horizon, not that every individual strand stays bounded forever —
// over a long enough evolution run, some strand eventually drifts to the
// BOUND_THRESHOLD boundary and stepRK4's freeze holds it there indefinitely,
// even while coefficients keep reverting toward "known good." Left unfixed
// this is exactly what reads as the whole beast slowly withering down to a
// handful of surviving strands. Respawning just that one strand — not the
// whole bundle — is what keeps the beast visually "whole" while still
// genuinely evolving.
//
// This must be counted in STEPS, not calls: growBundle writes the entire
// requested chunk every call regardless of whether the strand is frozen (a
// frozen strand just writes the same duplicate value `maxNewSteps` times),
// so a fixed call-count threshold at a large per-frame step budget can let
// thousands of stuck positions pile up before respawn even triggers — which
// is exactly what still produced long snap segments after only smoothing a
// small, fixed number of trailing points.
const STUCK_RESET_STEPS = 90;
// Hard ceiling on how many trailing points a single respawn will smooth,
// regardless of how large the accumulated stuck run got — keeps one
// respawn's cost bounded even in a pathological case.
const MAX_RESPAWN_SMOOTH_STEPS = 2000;

function driftAxisInPlace(coeffs, original, rng, noiseAmount, reversionAmount) {
  for (let i = 0; i < coeffs.length; i += 1) {
    if (coeffs[i] !== 0) {
      const reversion = (original[i] - coeffs[i]) * reversionAmount;
      const noise = (rng() * 2 - 1) * noiseAmount;
      const next = coeffs[i] + reversion + noise;
      coeffs[i] = Math.max(
        -COEFF_DRIFT_CLAMP,
        Math.min(COEFF_DRIFT_CLAMP, next)
      );
    }
  }
}

// Nudges a bundle's ODE coefficients — mean-reverting, not a pure random
// walk: each coefficient is pulled a little toward its original
// (generation-time, validated) value every tick, plus a small random
// perturbation. The beast's curves keep subtly changing over real time
// (nullHashPixel's beasts.ink does the same), but orbit around a known-good
// configuration rather than wandering arbitrarily far from one. No
// reintegration here: the coefficients just drift, and whatever growBundle
// computes next naturally reflects the new values — there's nothing to
// revert. Safety against a still-unstable moment comes from stepRK4's own
// per-step freeze (odeIntegrator.js): a strand whose current coefficients
// push a step out of bounds simply stops advancing until drift carries it
// back into a stable region.
export function driftCoeffs(bundle, rng, evolutionSpeed, deltaSeconds) {
  const noiseAmount = DRIFT_STEP * evolutionSpeed * deltaSeconds;
  const reversionAmount = REVERSION_RATE * evolutionSpeed * deltaSeconds;
  if (noiseAmount <= 0 && reversionAmount <= 0) return;
  driftAxisInPlace(
    bundle.coeffs.dx,
    bundle.originalCoeffs.dx,
    rng,
    noiseAmount,
    reversionAmount
  );
  driftAxisInPlace(
    bundle.coeffs.dy,
    bundle.originalCoeffs.dy,
    rng,
    noiseAmount,
    reversionAmount
  );
  driftAxisInPlace(
    bundle.coeffs.dz,
    bundle.originalCoeffs.dz,
    rng,
    noiseAmount,
    reversionAmount
  );
}

function rebaseWindow(bundle) {
  const dropCount = Math.max(1, Math.floor(bundle.steps * REBASE_FRACTION));
  bundle.strands.forEach((strand) => strand.copyWithin(0, dropCount * 3));
  bundle.grownSteps -= dropCount;
}

// Lazily attaches per-strand stuck-tracking state to a bundle the first time
// it evolves. `previousCurrent` is a persistent scratch mirror of
// bundle.current (not reallocated every call — see docs/scene-performance-
// checklist.md) used only to detect whether a strand actually moved this
// call.
function ensureStuckTracking(bundle) {
  if (!bundle.stuckCounts) {
    bundle.stuckCounts = bundle.startPoints.map(() => 0);
    bundle.previousCurrent = bundle.current.map((c) => [c[0], c[1], c[2]]);
  }
}

// Collapses the trailing `smoothCount` buffer points for strand `s` onto
// `start`, so the visible trail shows a stationary (zero-length, invisible)
// run there instead of a long segment connecting the old stuck position to
// the new one. `smoothCount` must cover the *entire* accumulated stuck run
// (see STUCK_RESET_STEPS) — smoothing fewer than that just moves the snap
// earlier in the buffer instead of eliminating it.
function smoothRespawnTail(bundle, s, start, smoothCount) {
  const strand = bundle.strands[s * 2];
  const mirror = bundle.strands[s * 2 + 1];
  const overwriteCount = Math.min(smoothCount, bundle.grownSteps);
  for (let k = 0; k < overwriteCount; k += 1) {
    const idx = (bundle.grownSteps - 1 - k) * 3;
    [strand[idx], strand[idx + 1], strand[idx + 2]] = start;
    [mirror[idx], mirror[idx + 1], mirror[idx + 2]] = [
      -start[0],
      start[1],
      start[2],
    ];
  }
}

// Returns whether any strand respawned — callers need to know, same reason
// as `rebased`: it means points in the existing buffer changed retroactively
// (smoothRespawnTail rewrites trailing history), so the geometry needs a
// full rewrite of the valid range, not just an append of what's new.
// `stepsThisCall` is how many buffer positions this specific advanceEvolution
// call just wrote (frozen or not — growBundle writes the full requested
// chunk either way), which is exactly how much a non-moving strand's stuck
// run just grew by.
function respawnStuckStrands(bundle, stepsThisCall) {
  let anyRespawned = false;

  bundle.startPoints.forEach((start, s) => {
    const before = bundle.previousCurrent[s];
    const after = bundle.current[s];
    const moved =
      before[0] !== after[0] ||
      before[1] !== after[1] ||
      before[2] !== after[2];

    if (moved) {
      bundle.stuckCounts[s] = 0;
    } else {
      bundle.stuckCounts[s] += stepsThisCall;
      if (bundle.stuckCounts[s] >= STUCK_RESET_STEPS) {
        const smoothCount = Math.min(
          bundle.stuckCounts[s],
          MAX_RESPAWN_SMOOTH_STEPS
        );
        [after[0], after[1], after[2]] = start;
        smoothRespawnTail(bundle, s, start, smoothCount);
        bundle.stuckCounts[s] = 0;
        anyRespawned = true;
      }
    }

    [before[0], before[1], before[2]] = after;
  });

  return anyRespawned;
}

// Advances a bundle's tip forward by up to `maxNewSteps`, the same way
// growth does (reuses growBundle directly — same math, same float64
// `bundle.current` state, so this is a genuine continuation of growth, not a
// different mechanism) — except once the window fills, it rebases (drops
// the oldest chunk, shifts the rest forward) instead of stopping. This is
// the "keep advecting from the tip while the tail disappears" behavior —
// never a full recompute from t=0, just the next increment. Also detects
// and respawns any individual strand that's been stuck (see
// STUCK_RESET_STEPS above) so the beast keeps evolving instead of
// withering.
// Returns whether the geometry needs a full rewrite of the valid range
// (true if a rebase or a respawn happened — both retroactively change
// existing buffer positions) rather than just an append of the new steps.
export function advanceEvolution(bundle, maxNewSteps) {
  ensureStuckTracking(bundle);

  let remaining = maxNewSteps;
  let rebased = false;
  while (remaining > 0) {
    const done = growBundle(bundle, remaining);
    remaining -= done;
    if (remaining <= 0) break;
    rebaseWindow(bundle);
    rebased = true;
  }

  const respawned = respawnStuckStrands(bundle, maxNewSteps);
  return rebased || respawned;
}
