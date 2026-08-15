/* eslint-disable no-param-reassign */
import { growBundle } from './testGenerator';

const DRIFT_STEP = 0.012;
// Pulls coefficients back toward their validated original each tick —
// unbounded random-walk drift eventually wanders into unstable territory.
const REVERSION_RATE = 0.15;
const COEFF_DRIFT_CLAMP = 3;
// Dropping exactly the tail matching each call's growth (1-2 steps at
// typical pacing) would be perfectly smooth, but copyWithin's cost is
// proportional to the *whole remaining buffer*, not the drop amount — an
// array.length-1 element shift either way. Rebasing every single call
// instead of every ~30 (the old REBASE_FRACTION cadence) multiplies total
// rebase work by ~30x, measured well past the frame budget at heavy
// settings. Over-dropping by this floor whenever a rebase is needed banks
// the surplus as slack the next several calls can grow into for free,
// cutting rebase frequency back down — chunks this small read as
// continuous erosion rather than the old ~3%-of-buffer pop.
const REBASE_BATCH_FLOOR = 12;
// Counted in steps, not advanceEvolution calls — growBundle writes the full
// requested chunk every call even when frozen, so a call-count threshold
// under-triggers at a large per-frame budget.
const STUCK_RESET_STEPS = 90;

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

// respawnHiddenStep markers shift with the window (same copyWithin the
// position data gets) so a hidden segment stays hidden as it ages toward
// the front, instead of pointing at the wrong step after a rebase.
function rebaseWindow(bundle, dropCount) {
  bundle.strands.forEach((strand) => strand.copyWithin(0, dropCount * 3));
  bundle.grownSteps -= dropCount;
  for (let s = 0; s < bundle.respawnHiddenStep.length; s += 1) {
    if (bundle.respawnHiddenStep[s] >= 0) {
      bundle.respawnHiddenStep[s] -= dropCount;
      if (bundle.respawnHiddenStep[s] < 0) bundle.respawnHiddenStep[s] = -1;
    }
  }
}

function ensureStuckTracking(bundle) {
  if (!bundle.stuckCounts) {
    bundle.stuckCounts = bundle.startPoints.map(() => 0);
    bundle.previousCurrent = bundle.current.map((c) => [c[0], c[1], c[2]]);
    bundle.respawnHiddenStep = bundle.startPoints.map(() => -1);
  }
}

// A respawned strand's tip jumps to its own start point — genuinely far from
// wherever it froze, so no repositioning of the existing trail can make that
// transition look continuous. Instead of faking it in the data, the one
// connecting segment is marked hidden and skipped at render time (see
// buildStrokeGeometry.js/TestStrokes.jsx), same approach as Weightless's
// trail material. `smoothRespawns` only gates that hiding; the respawn
// itself always happens.
function respawnStuckStrands(bundle, stepsThisCall, smoothRespawns) {
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
        [after[0], after[1], after[2]] = start;
        if (smoothRespawns) bundle.respawnHiddenStep[s] = bundle.grownSteps - 1;
        bundle.stuckCounts[s] = 0;
        anyRespawned = true;
      }
    }

    [before[0], before[1], before[2]] = after;
  });

  return anyRespawned;
}

// Advances a bundle's tip like growth does, but rebases (drops from the
// tail) instead of stopping once the window fills — the "advect from the
// tip, tail disappears" behavior. Drops REBASE_BATCH_FLOOR steps at a time
// (not a fraction of the whole window, and not a single call's worth) —
// small enough to read as continuous erosion, large enough to keep
// copyWithin calls infrequent. Returns whether the geometry needs a full
// rewrite (rebase or respawn both retroactively change existing positions)
// rather than just an append.
export function advanceEvolution(bundle, maxNewSteps, smoothRespawns = true) {
  ensureStuckTracking(bundle);

  let remaining = maxNewSteps;
  let rebased = false;
  while (remaining > 0) {
    const done = growBundle(bundle, remaining);
    remaining -= done;
    if (remaining <= 0) break;
    const dropCount = Math.min(
      Math.max(remaining, REBASE_BATCH_FLOOR),
      bundle.steps - 1
    );
    rebaseWindow(bundle, dropCount);
    rebased = true;
  }

  const respawned = respawnStuckStrands(bundle, maxNewSteps, smoothRespawns);
  return rebased || respawned;
}
