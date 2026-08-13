/* eslint-disable no-param-reassign */
// Writes into caller-owned buffers throughout (mirrorInto, reintegrateBundle)
// so evolution ticks never reallocate trajectory data — same pattern as
// utils/odeIntegrator.js.
import findBoundedCoeffs from './formulaBuilder';
import {
  BOUND_THRESHOLD,
  MIN_SPREAD,
  integrate,
  isBounded,
} from './odeIntegrator';
import createRng from './rng';

// Leva-tunable defaults (see hooks/useSceneControls.js's Test folder).
export const DEFAULT_BUNDLE_COUNT = 4;
export const DEFAULT_STRANDS_PER_BUNDLE = 9;
// 220 steps @ DT=0.02 is only ~4.4 simulated time-units — not enough for a
// bounded field to loop/curl around itself more than once or twice, which
// read as "simple curves" rather than the reference's complex, curling
// strokes. 600 gives roughly 3x the winding time at the same cost per step.
export const DEFAULT_STEPS = 600;
export const DEFAULT_START_SPREAD = 0.35;
export const DEFAULT_COEFF_RANGE = 1.6;
// Shared "curl tightness" scalar inside every trig term's argument — see
// odeIntegrator.js's evalAxis. Period of a single term is 2π/freq; 0.6 gives
// a full curl roughly every ~10 units, visible within the bundle's typical
// excursion range without looking like noise.
export const DEFAULT_FREQ = 0.6;

const DT = 0.02;
const ORIGIN_SPREAD = [3, 2, 2];
const TARGET_RADIUS = 7;
const MAX_BUNDLE_ATTEMPTS = 30;

function mirrorInto(points, out) {
  for (let i = 0; i < points.length; i += 3) {
    out[i] = -points[i];
    out[i + 1] = points[i + 1];
    out[i + 2] = points[i + 2];
  }
}

// Re-integrates a bundle's strands from its (fixed) start points using its
// current coefficients, writing into the bundle's existing Float32Arrays —
// used both for the initial build and every evolution tick, so evolution
// never reallocates trajectory buffers. `bundle.steps`/`bundle.freq` travel
// with the bundle rather than module constants, since both are per-generation
// (Leva-tunable) settings.
export function reintegrateBundle(bundle) {
  bundle.startPoints.forEach((start, s) => {
    integrate(
      bundle.coeffs,
      start,
      bundle.steps,
      DT,
      bundle.freq,
      bundle.strands[s * 2]
    );
    mirrorInto(bundle.strands[s * 2], bundle.strands[s * 2 + 1]);
  });
}

function randomColor(rng, monochrome) {
  if (monochrome) return { h: 0, s: 0, l: 0.12 };
  return { h: rng(), s: 0.55 + rng() * 0.3, l: 0.35 + rng() * 0.15 };
}

// formulaBuilder's findBoundedCoeffs only checks a single probe point (the
// bundle's origin) — cheap, but a real strand seeded startSpread away can
// still escape even when the origin trajectory doesn't (these are chaotic
// fields; nearby starts diverge). So the authoritative check integrates
// every *real* strand and requires all of them to stay bounded, retrying
// with fresh coefficients when they don't. This is also what keeps a stray
// strand from setting the whole test's display scale (measureMaxDistance
// takes the single farthest point across every strand).
function allRealStrandsBounded(coeffs, startPoints, strands, steps, freq) {
  for (let s = 0; s < startPoints.length; s += 1) {
    integrate(coeffs, startPoints[s], steps, DT, freq, strands[s * 2]);
    if (!isBounded(strands[s * 2], BOUND_THRESHOLD, MIN_SPREAD)) return false;
  }
  return true;
}

function buildBundle(rng, monochrome, id, options) {
  const { strandsPerBundle, steps, startSpread, coeffRange, freq } = options;

  const origin = [
    (rng() * 2 - 1) * ORIGIN_SPREAD[0],
    (rng() * 2 - 1) * ORIGIN_SPREAD[1],
    (rng() * 2 - 1) * ORIGIN_SPREAD[2],
  ];

  const startPoints = [];
  const strands = [];
  for (let s = 0; s < strandsPerBundle; s += 1) {
    startPoints.push([
      origin[0] + (rng() * 2 - 1) * startSpread,
      origin[1] + (rng() * 2 - 1) * startSpread,
      origin[2] + (rng() * 2 - 1) * startSpread,
    ]);
    strands.push(new Float32Array(steps * 3), new Float32Array(steps * 3));
  }

  let coeffs = findBoundedCoeffs(rng, origin, coeffRange, steps, freq);
  let attempts = 0;
  while (
    !allRealStrandsBounded(coeffs, startPoints, strands, steps, freq) &&
    attempts < MAX_BUNDLE_ATTEMPTS
  ) {
    coeffs = findBoundedCoeffs(rng, origin, coeffRange, steps, freq);
    attempts += 1;
  }

  const bundle = {
    id,
    coeffs,
    startPoints,
    strands,
    steps,
    freq,
    color: randomColor(rng, monochrome),
  };
  reintegrateBundle(bundle);
  return bundle;
}

function measureMaxDistance(bundles) {
  let maxDist = 0;
  bundles.forEach((bundle) => {
    bundle.strands.forEach((points) => {
      for (let i = 0; i < points.length; i += 3) {
        const dist = Math.hypot(points[i], points[i + 1], points[i + 2]);
        if (dist > maxDist) maxDist = dist;
      }
    });
  });
  return maxDist;
}

// Generates a test for a seed: `bundleCount` bundles (formula-builder +
// rejection-sampled coefficients, shared per bundle), each `strandsPerBundle`
// mirrored stroke pairs (bilateral symmetry across X=0, the classic
// Rorschach fold). Returns a display `scale` rather than baking it into the
// points, so evolution's re-integration always happens in the ODE's own
// unscaled space — plus `steps`/`strandsPerBundle` so downstream renderers
// don't need to know the generation settings separately.
export default function generateTest(seed, options = {}) {
  const {
    monochrome = false,
    bundleCount = DEFAULT_BUNDLE_COUNT,
    strandsPerBundle = DEFAULT_STRANDS_PER_BUNDLE,
    steps = DEFAULT_STEPS,
    startSpread = DEFAULT_START_SPREAD,
    coeffRange = DEFAULT_COEFF_RANGE,
    freq = DEFAULT_FREQ,
  } = options;

  const rng = createRng(seed);
  const bundleOptions = {
    strandsPerBundle,
    steps,
    startSpread,
    coeffRange,
    freq,
  };

  const bundles = [];
  for (let i = 0; i < bundleCount; i += 1) {
    bundles.push(buildBundle(rng, monochrome, i, bundleOptions));
  }

  const maxDist = measureMaxDistance(bundles);
  const scale = maxDist > 0 ? TARGET_RADIUS / maxDist : 1;

  return { bundles, scale, steps, strandsPerBundle };
}
