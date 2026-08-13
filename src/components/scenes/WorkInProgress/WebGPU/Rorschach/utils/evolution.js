/* eslint-disable no-param-reassign */
// Mutates bundle.coeffs and the scratch arrays in place — see
// utils/testGenerator.js and utils/odeIntegrator.js for the same pattern.
import { BOUND_THRESHOLD, MIN_SPREAD, isBounded } from './odeIntegrator';
import { reintegrateBundle } from './testGenerator';

// Fraction of COEFF_RANGE nudged per second at evolutionSpeed = 1.
const DRIFT_STEP = 0.012;

// Module-level scratch (not per-call allocations) — evolveBundle runs
// sequentially per bundle within a single frame tick, never re-entrantly, so
// reusing these across calls/bundles is safe and keeps the hot path
// allocation-free per docs/scene-performance-checklist.md.
const scratchDx = [];
const scratchDy = [];
const scratchDz = [];

function driftAxisInPlace(coeffs, scratch, rng, amount) {
  scratch.length = coeffs.length;
  for (let i = 0; i < coeffs.length; i += 1) {
    scratch[i] = coeffs[i];
    if (coeffs[i] !== 0) coeffs[i] += (rng() * 2 - 1) * amount;
  }
}

function restoreAxis(coeffs, scratch) {
  for (let i = 0; i < coeffs.length; i += 1) coeffs[i] = scratch[i];
}

// Nudges a bundle's ODE coefficients by a small random walk and
// re-integrates — the test keeps subtly changing after its growth reveal
// settles (nullHashPixel's tests.ink does the same: coefficients drift
// slowly over real time). Reverts the nudge if it pushes the field out of
// bounds or collapses it, so evolution never suddenly implodes/explodes the
// test — it just pauses that bundle for a tick and tries again next time.
export default function evolveBundle(
  bundle,
  rng,
  evolutionSpeed,
  deltaSeconds
) {
  const amount = DRIFT_STEP * evolutionSpeed * deltaSeconds;
  if (amount <= 0) return;

  driftAxisInPlace(bundle.coeffs.dx, scratchDx, rng, amount);
  driftAxisInPlace(bundle.coeffs.dy, scratchDy, rng, amount);
  driftAxisInPlace(bundle.coeffs.dz, scratchDz, rng, amount);

  reintegrateBundle(bundle);

  if (!isBounded(bundle.strands[0], BOUND_THRESHOLD, MIN_SPREAD)) {
    restoreAxis(bundle.coeffs.dx, scratchDx);
    restoreAxis(bundle.coeffs.dy, scratchDy);
    restoreAxis(bundle.coeffs.dz, scratchDz);
    reintegrateBundle(bundle);
  }
}
