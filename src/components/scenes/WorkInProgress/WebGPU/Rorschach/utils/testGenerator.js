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
  stepRK4,
} from './odeIntegrator';
import { hexToHsl, resolvePaletteColors, sampleGradientHsl } from './palette';
import createRng, { combineSeed } from './rng';

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
// The trig basis is bounded by construction, so in practice a candidate
// either passes on the first attempt or is a rare edge case — measured
// average is ~1.0 attempts at realistic settings. This is a safety net for
// that rare case, not the normal path, so it doesn't need to be large.
const MAX_BUNDLE_ATTEMPTS = 8;
// The retry loop's own validation pass is capped independently of the
// user-facing `steps` slider — it only needs enough length to tell "stays
// bounded" from "diverges/collapses," not the full curl detail. At large
// `steps` (this scene's own saved preset uses 2000) validating at full
// length on every one of up to MAX_BUNDLE_ATTEMPTS retries was the direct
// cause of multi-second control-change freezes (todo.md: "scene locks the
// browser on control changes"). The rest of each strand out to the full
// `steps` is grown incrementally, a little per frame — see growBundle.
const VALIDATION_STEPS_CAP = 300;
// Distinct salt so the "no override, no palette" random-hue color path has
// its own independent stream, separate from the structural RNG (origin,
// formula search) — see computeBundleColor. Keeps color generation entirely
// decoupled from shape generation now that they're computed by separate
// functions with separate (and very different cost) call sites.
const COLOR_SALT = 7;

function mirrorInto(points, out) {
  for (let i = 0; i < points.length; i += 3) {
    out[i] = -points[i];
    out[i + 1] = points[i + 1];
    out[i + 2] = points[i + 2];
  }
}

// Reused across every growBundle call — no per-step allocation.
const stepScratch = [0, 0, 0];

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

// formulaBuilder's findBoundedCoeffs only checks a single probe point (the
// bundle's origin) — cheap, but a real strand seeded startSpread away can
// still escape even when the origin trajectory doesn't (these are chaotic
// fields; nearby starts diverge). So the authoritative check integrates
// every *real* strand and requires all of them to stay bounded, retrying
// with fresh coefficients when they don't — but only for VALIDATION_STEPS_CAP
// steps, not the full (possibly 2000+) `steps`. isBounded is scoped to that
// written prefix via subarray, same reasoning as formulaBuilder.js's probe.
// This pass's integration isn't thrown away on acceptance: buildBundle seeds
// the bundle's `grownSteps` cursor from it directly, and also reuses its
// per-point distances to size the display scale — see generateStructure —
// rather than requiring a separate full-length pass just to measure it.
function validateAndMeasure(coeffs, startPoints, strands, steps, freq) {
  const validationSteps = Math.min(steps, VALIDATION_STEPS_CAP);
  let maxDist = 0;
  const endpoints = [];
  for (let s = 0; s < startPoints.length; s += 1) {
    const strand = strands[s * 2];
    integrate(coeffs, startPoints[s], validationSteps, DT, freq, strand);
    const view = strand.subarray(0, validationSteps * 3);
    if (!isBounded(view, BOUND_THRESHOLD, MIN_SPREAD)) {
      return { ok: false, maxDist: 0, validationSteps, endpoints: [] };
    }
    for (let i = 0; i < view.length; i += 3) {
      const dist = Math.hypot(view[i], view[i + 1], view[i + 2]);
      if (dist > maxDist) maxDist = dist;
    }
    const last = (validationSteps - 1) * 3;
    endpoints.push([view[last], view[last + 1], view[last + 2]]);
  }
  return { ok: true, maxDist, validationSteps, endpoints };
}

// Structural generation: coefficients + trajectories only, no color/
// visibility/growth-delay. This is the expensive half (ODE search + RK4
// integration) — deliberately has no dependency on monochrome/inkColor/
// palette/overrides, so tweaking any of those never re-runs it. Each bundle
// gets its own independent RNG stream (combineSeed(seed, id)) rather than
// sharing one sequential stream, so bundleCount/strandsPerBundle changes
// don't reshuffle bundles that already existed.
//
// Does NOT fully integrate every strand out to `steps` — only validates up
// to VALIDATION_STEPS_CAP and leaves the rest of each buffer zeroed.
// `bundle.grownSteps` starts at that validated length (not 1: the
// validation pass's own integration is real, correct data, not thrown
// away), and growBundle() below advances it the rest of the way — spread
// across frames by the caller, not all in this one synchronous call. This
// is what turns a multi-second blocking freeze on every control change into
// a real, incremental, never-blocking growth animation.
function buildBundle(seed, id, options) {
  const { strandsPerBundle, steps, startSpread, coeffRange, freq } = options;
  const rng = createRng(combineSeed(seed, id));

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
  let result = validateAndMeasure(coeffs, startPoints, strands, steps, freq);
  let attempts = 0;
  while (!result.ok && attempts < MAX_BUNDLE_ATTEMPTS) {
    coeffs = findBoundedCoeffs(rng, origin, coeffRange, steps, freq);
    result = validateAndMeasure(coeffs, startPoints, strands, steps, freq);
    attempts += 1;
  }

  // Backfill the mirror strand for the validated prefix the accepted
  // candidate's strand already holds (only the primary strand was written
  // above) — growBundle keeps both in sync for everything after this.
  for (let s = 0; s < strandsPerBundle; s += 1) {
    const view = strands[s * 2].subarray(0, result.validationSteps * 3);
    mirrorInto(
      view,
      strands[s * 2 + 1].subarray(0, result.validationSteps * 3)
    );
  }

  return {
    id,
    coeffs,
    // Independent snapshot (not a reference to coeffs' arrays) of the
    // validated, known-bounded coefficients — evolution.js's drift pulls
    // `coeffs` back toward this over time rather than letting it wander
    // away from a configuration that was actually verified to work.
    originalCoeffs: {
      dx: coeffs.dx.slice(),
      dy: coeffs.dy.slice(),
      dz: coeffs.dz.slice(),
    },
    startPoints,
    strands,
    steps,
    freq,
    grownSteps: result.validationSteps,
    // Full float64 stepping state per strand, carried forward by growBundle
    // independently of the (float32) render buffer — see growBundle's own
    // comment for why this matters.
    current: result.endpoints,
    maxDist: result.maxDist,
  };
}

// Advances a bundle's growth by up to `maxNewSteps` more RK4 steps (fewer if
// that would exceed `bundle.steps`), continuing from wherever grownSteps
// left off — never re-walks steps that already exist. Called from Test.jsx's
// useFrame with a small per-frame budget, not all at once. Returns how many
// new steps were actually computed (0 once fully grown).
//
// Steps from `bundle.current` (float64), not by reading the last point back
// out of the (float32) strand buffer. Growth is split across many separate
// calls, one small chunk per frame — reading the running position back from
// a Float32Array at every chunk boundary would round it to float32 on every
// single call, and this is a chaotic system: those roundings compound over
// dozens of chunks into a visibly different final shape, and worse, one that
// depends on how growth happened to get chunked (framerate/hardware), not
// just on the seed. Carrying the true float64 position forward in
// `bundle.current` keeps growth's result independent of how it was paced —
// same seed always grows into the same beast, regardless of frame timing.
export function growBundle(bundle, maxNewSteps) {
  const targetStep = Math.min(bundle.steps, bundle.grownSteps + maxNewSteps);
  const newStepsCount = targetStep - bundle.grownSteps;
  if (newStepsCount <= 0) return 0;

  for (let s = 0; s < bundle.startPoints.length; s += 1) {
    const strand = bundle.strands[s * 2];
    const mirror = bundle.strands[s * 2 + 1];
    const current = bundle.current[s];
    let x = current[0];
    let y = current[1];
    let z = current[2];

    for (let i = bundle.grownSteps; i < targetStep; i += 1) {
      stepRK4(bundle.coeffs, x, y, z, DT, bundle.freq, stepScratch);
      [x, y, z] = stepScratch;

      const o = i * 3;
      strand[o] = x;
      strand[o + 1] = y;
      strand[o + 2] = z;
      mirror[o] = -x;
      mirror[o + 1] = y;
      mirror[o + 2] = z;
    }

    current[0] = x;
    current[1] = y;
    current[2] = z;
  }

  bundle.grownSteps = targetStep;
  return newStepsCount;
}

// Generates the structural half of a beast: `bundleCount` bundles, each
// `strandsPerBundle` mirrored stroke pairs (bilateral symmetry across X=0,
// the classic Rorschach fold). Returns a display `scale` rather than baking
// it into the points, so evolution's re-integration always happens in the
// ODE's own unscaled space — sized from each bundle's validation-pass
// maxDist (an estimate from the first VALIDATION_STEPS_CAP steps, not the
// full trajectory, since the full trajectory doesn't exist synchronously
// anymore) rather than a full measurement pass. Depends only on
// seed/bundleCount/strandsPerBundle/steps/startSpread/coeffRange/freq — pair
// with computeStyles for color/visibility/growth-delay, which is cheap
// enough to recompute on every style-only control change without ever
// touching this.
export function generateStructure(seed, options = {}) {
  const {
    bundleCount = DEFAULT_BUNDLE_COUNT,
    strandsPerBundle = DEFAULT_STRANDS_PER_BUNDLE,
    steps = DEFAULT_STEPS,
    startSpread = DEFAULT_START_SPREAD,
    coeffRange = DEFAULT_COEFF_RANGE,
    freq = DEFAULT_FREQ,
  } = options;

  const bundleOptions = {
    strandsPerBundle,
    steps,
    startSpread,
    coeffRange,
    freq,
  };

  const bundles = [];
  let maxDist = 0;
  for (let i = 0; i < bundleCount; i += 1) {
    const bundle = buildBundle(seed, i, bundleOptions);
    if (bundle.maxDist > maxDist) maxDist = bundle.maxDist;
    bundles.push(bundle);
  }

  const scale = maxDist > 0 ? TARGET_RADIUS / maxDist : 1;

  return { bundles, scale, steps, strandsPerBundle };
}

// `paletteColors`/`t` (bundle position 0-1 across the beast) sample a named
// gradient from gradients.json instead of a random hue when a palette is
// selected — see utils/palette.js. Falls back to the original random-hue
// behavior when no palette is chosen ('Random' in the Leva dropdown), using
// its own independent RNG stream (COLOR_SALT) rather than sharing the
// structural one. `inkColor` is the monochrome-mode override, `override` the
// Bundle Editor's entry for this index (or {}).
function computeBundleColor(
  seed,
  id,
  monochrome,
  inkColor,
  paletteColors,
  t,
  override
) {
  if (override.colorOverride) return hexToHsl(override.color);
  if (monochrome) return hexToHsl(inkColor);
  if (paletteColors) return sampleGradientHsl(paletteColors, t);
  const rng = createRng(combineSeed(seed, id, COLOR_SALT));
  return { h: rng(), s: 0.55 + rng() * 0.3, l: 0.35 + rng() * 0.15 };
}

// Style generation: color/visibility/growth-delay for `bundleCount` bundles.
// No ODE math at all — safe to recompute on every keystroke of monochrome/
// inkColor/palette/Bundle Editor changes without the cost generateStructure
// has. `overrides` is the Bundle Editor's map of bundle-index -> per-bundle
// art-direction overrides, applied on top of otherwise-normal styling.
export function computeStyles(seed, bundleCount, options = {}) {
  const {
    monochrome = false,
    inkColor = '#1f1f1f',
    palette = 'Random',
    overrides = {},
  } = options;
  const paletteColors = resolvePaletteColors(palette);

  const styles = [];
  for (let i = 0; i < bundleCount; i += 1) {
    const t = bundleCount > 1 ? i / (bundleCount - 1) : 0;
    const override = overrides[i] || {};
    styles.push({
      color: computeBundleColor(
        seed,
        i,
        monochrome,
        inkColor,
        paletteColors,
        t,
        override
      ),
      visible: override.visible !== false,
      growthDelay: override.growthDelay || 0,
    });
  }
  return styles;
}
